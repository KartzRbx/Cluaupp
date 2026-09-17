"use strict";

const { compileSource } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, makeGame, buildGame, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const libs = compileSource(
	`#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

void init() {
	Janitor* janitor = new Janitor();
	janitor::Cleanup();
}
`,
	"libs.server.clpp",
	{ strict: true },
);
contains(libs, ["Janitor"], "Janitor emit");
refuses(libs, ["require(ClppLibs."], "libs must not keep ClppLibs placeholder");

const game = makeGame({
	"src/shared/constants/TemplateData.clh": `#pragma once
struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
	int CurrentIsland = 1;
};
`,
	"src/server/shop/ShopService.clh": `#pragma once
struct ShopService {
	int Stock = 3;
	void Buy(Player* player);
};
`,
	"src/server/shop/ShopService.clp": `#include "ShopService.clh"

void ShopService::Buy(Player* player) {
	Stock = Stock - 1;
}
`,
	"src/server/boot/DataBoot.server.clpp": `#include <clpp/libs/dataservice.clh>
#include "shared/constants/TemplateData.clh"

void init() {
	TemplateData playerData;
	post("boot");
}
`,
});

expect(buildGame(game).failed === 0, "modular game build failed", listOut(game).join("\n"));

const outTree = listOut(game);
expect(outTree.includes("shared/constants/TemplateData.luau"), "TemplateData out", outTree.join("\n"));
expect(outTree.includes("server/boot/DataBoot.server.luau"), "DataBoot out", outTree.join("\n"));
expect(
	outTree.some((name) => /shop\/ShopService/i.test(name)),
	"ShopService out",
	outTree.join("\n"),
);

const dataBoot = readOut(game, "server/boot/DataBoot.server.luau");
contains(dataBoot, ["init()"], "DataBoot init");
refuses(dataBoot, ["require(ClppLibs."], "DataBoot ClppLibs");

console.log("Cluaupp modules ok");
console.log(outTree.join("\n"));
