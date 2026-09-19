"use strict";

const { compileSource } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, makeGame, buildGame, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const libs = compileSource(
	`#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>

void init() {
	Sweep sweep = new Sweep();
	sweep.Cleanup();
}
`,
	"libs.server.clpp",
	{ strict: true },
);
contains(libs, ["Sweep", "CluauppLibs.Sweep"], "Sweep emit + require");
refuses(libs, ["require(ClppLibs."], "libs must not keep ClppLibs placeholder");

const game = makeGame({
	"src/ReplicatedStorage/Shared/Constants/Datas/PlayerData.clh": `#pragma once
struct PlayerData {
	int Money = 0;
	int Level = 1;
};
`,
	"src/ServerScriptService/Boot/boot.server.clpp": `#include <clpp/roblox.clh>
#include <clpp/libs/keep.clh>
#include "../../ReplicatedStorage/Shared/Constants/Datas/PlayerData.clh"

void init() {
	PlayerData playerData;
	post("boot");
}
`,
});

expect(buildGame(game).failed === 0, "modular game build failed", listOut(game).join("\n"));

const outTree = listOut(game);
expect(outTree.includes("ReplicatedStorage/Shared/Constants/Datas/PlayerData.luau"), "PlayerData out", outTree.join("\n"));
expect(outTree.includes("ServerScriptService/Boot/boot.server.luau"), "boot out", outTree.join("\n"));

const dataBoot = readOut(game, "ServerScriptService/Boot/boot.server.luau");
contains(dataBoot, ["init()", "CluauppLibs.Keep"], "boot init + Keep require");
refuses(dataBoot, ["require(ClppLibs."], "boot ClppLibs");

console.log("Cluaupp modules ok");
console.log(outTree.join("\n"));
