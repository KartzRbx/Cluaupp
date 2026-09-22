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
import { PlayerData } from "../../ReplicatedStorage/Shared/Constants/Datas/PlayerData.clh";

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

// Named import — requires CL++ 0.8+. Skip gracefully on 0.7.
const { clppVersion } = require("../generated/clpp/runner");
const ver = String(clppVersion() || "");
const m = ver.match(/(\d+)\.(\d+)/);
const canImport = m && (Number(m[1]) > 0 || Number(m[2]) >= 8);
if (canImport) {
	const imported = makeGame({
		"src/ReplicatedStorage/Shared/Constants/Datas/PlayerData.clh": `#pragma once
struct Wallet {
	int Coins = 0;
};
struct PlayerData {
	int Money = 0;
};
`,
		"src/ServerScriptService/Boot/boot.server.clpp": `#include <clpp/roblox.clh>
import { Wallet, PlayerData as Data } from "../../ReplicatedStorage/Shared/Constants/Datas/PlayerData.clh";

void init() {
	Wallet w;
	Data d;
	post(w.Coins);
}
`,
	});
	expect(buildGame(imported).failed === 0, "named import game build", listOut(imported).join("\n"));
	const bootLuau = readOut(imported, "ServerScriptService/Boot/boot.server.luau");
	refuses(bootLuau, ["script.Parent.Parent.Parent.ReplicatedStorage"], "import require game-rooted");
	contains(bootLuau, ["require(ReplicatedStorage"], "import require ReplicatedStorage");
	console.log("Cluaupp named import build ok");
} else {
	console.log(`Cluaupp named import build skipped (clpp ${ver || "missing"} < 0.8)`);
}