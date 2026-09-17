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
	"src/shared/PlayerData.clh": `#pragma once
struct PlayerData {
	int Money = 0;
	int Level = 1;
};
`,
	"src/server/boot.server.clpp": `#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>
#include "../shared/PlayerData.clh"

void init() {
	PlayerData playerData;
	post("boot");
}
`,
});

expect(buildGame(game).failed === 0, "modular game build failed", listOut(game).join("\n"));

const outTree = listOut(game);
expect(outTree.includes("shared/PlayerData.luau"), "PlayerData out", outTree.join("\n"));
expect(outTree.includes("server/boot.server.luau"), "boot out", outTree.join("\n"));

const dataBoot = readOut(game, "server/boot.server.luau");
contains(dataBoot, ["init()"], "boot init");
refuses(dataBoot, ["require(ClppLibs."], "boot ClppLibs");

console.log("Cluaupp modules ok");
console.log(outTree.join("\n"));
