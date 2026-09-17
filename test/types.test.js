"use strict";

const { compileSource, compileService } = require("../generated/compile");
const { contains, refuses, expect, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const pragma = compileSource("#pragma strict\nvoid init() { post(\"ok\"); }\n", "boot.clpp");
expect(pragma.includes("--!strict") || pragma.includes("print(\"ok\")"), "#pragma strict / init emit");

const nstrict = compileSource("#pragma nstrict\nvoid init() { post(\"ok\"); }\n", "boot.clpp", { strict: true });
expect(!nstrict.includes("--!strict") || nstrict.includes("print"), "#pragma nstrict path compiles");

const hello = compileSource(
	`#include <clpp/roblox.clh>

void init() {
	Players* players = GetService<Players>();
	post("online: " .: players::GetPlayers());
}
`,
	"hello.server.clpp",
	{ strict: true },
);
contains(hello, ['game:GetService("Players")', "init()"], "GetService / init");
refuses(hello, ["require(ClppLibs."], "no ClppLibs placeholder");

const concat = compileSource(
	`#include <clpp/roblox.clh>
void init() {
	Player* player = null;
	post("hi " .: player.Name);
}
`,
	"concat.clpp",
	{ strict: true },
);
contains(concat, [".."], "string concat .: → ..");

const data = compileSource(
	`#pragma once
#include <clpp/datatypes.clh>

struct PlayerDataCurrencies {
	int Coins = 0;
	int Rebirths = 0;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
};
`,
	"PlayerData.clh",
	{ strict: true, relativeName: "PlayerData.clh" },
);
contains(data, ["PlayerData", "Coins"], "header struct");

const tagged = compileService("void init() { post(\"ok\"); }\n", "hud.client.clpp", {
	strict: true,
	relativeName: "hud.client.clpp",
});
expect(tagged.kind === "flat", `client kind ${tagged.kind}`);
expect(tagged.files[0].name.replace(/\\/g, "/") === "hud.client.luau", `client out ${tagged.files[0].name}`);

const combat = compileSource(
	require("fs").readFileSync(require("path").join(__dirname, "..", "examples", "game", "src", "server", "combat.server.clpp"), "utf8"),
	"combat.server.clpp",
	{ strict: true },
);
contains(combat, ["init()"], "combat init");
refuses(combat, ["require(ClppLibs."], "combat ClppLibs");

console.log("Cluaupp types / CL++ emit ok");
