"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, writeFile, makeGame, copyTemplateGame, buildGame } = require("./helpers");

const template = copyTemplateGame({ strict: false });
const templateBuild = buildGame(template);
expect(templateBuild.failed === 0, `template build failed (${templateBuild.failed})`);

const templateTree = listOut(template);
expect(
	JSON.stringify(templateTree) === JSON.stringify([
		"client/init.client.luau",
		"server/leaderstats.server.luau",
		"shared/config.luau",
		"shared/configImpl.luau",
	]),
	"template out/ must be 1:1 with src tags",
	templateTree.join("\n"),
);

const leaderstats = readOut(template, "server/leaderstats.server.luau");
contains(leaderstats, ["CreateLeaderstats", "GetPlayers", "PlayerAdded", "init()"], "leaderstats.server.luau");
refuses(leaderstats, ["require(script.Main)", "LeaderStatsTypes", "DataController"], "flat leaderstats");

const client = readOut(template, "client/init.client.luau");
contains(client, ['print("Cluaupp client ok")', "init()"], "init.client.luau");

const config = readOut(template, "shared/config.luau");
contains(config, ["const STARTING_COINS", "return"], "config.h module");

const configImpl = readOut(template, "shared/configImpl.luau");
contains(configImpl, ["startingCoins", "STARTING_COINS"], "config.cpp impl");

for (const [file, kind, outName] of [
	["server/combat.server.cpp", "flat", "server/combat.server.luau"],
	["client/shop.client.cpp", "flat", "client/shop.client.luau"],
	["shared/damage.cpp", "module", "shared/Damage.luau"],
	["server/boot.legacy.server.cpp", "legacy", "server/boot.server.luau"],
	["tools.plugin.cpp", "flat", "tools.luau"],
]) {
	const src = file.includes("damage")
		? "int DamageOf(int base) { return base; }\n"
		: "void init() { print(\"ok\"); }\n";
	const result = compileService(src, file, { relativeName: file, strict: true });
	expect(result.kind === kind, `${file} kind ${result.kind}, expected ${kind}`);
	const name = result.files[0].name.replace(/\\/g, "/");
	expect(name === outName, `${file} → ${name}, expected ${outName}`);
}

const moduleOut = compileService("int DamageOf(int base) { return base; }\n", "shared/damage.cpp", {
	strict: true,
	relativeName: "shared/damage.cpp",
});
contains(moduleOut.files[0].contents, ["return {", "DamageOf = DamageOf"], "module table");
refuses(moduleOut.files[0].contents, ["\ninit()\n"], "module must not auto-run init");

const architecture = copyTemplateGame({ strict: true, architecture: true });
fs.rmSync(path.join(architecture, "src", "client"), { recursive: true, force: true });
fs.rmSync(path.join(architecture, "src", "shared"), { recursive: true, force: true });
expect(buildGame(architecture).failed === 0, "architecture build failed");
const archTree = listOut(architecture);
for (const name of [
	"server/LeaderStats/init.server.luau",
	"server/LeaderStats/init.meta.json",
	"server/LeaderStats/Main.luau",
	"server/LeaderStats/PlayersManager.luau",
	"server/LeaderStats/CacheController.luau",
	"server/LeaderStats/LeaderStatsTypes.luau",
]) {
	expect(archTree.includes(name), `architecture missing ${name}`, archTree.join("\n"));
}
expect(!archTree.includes("server/leaderstats.server.luau"), "architecture must not also emit the flat file", archTree.join("\n"));

const meta = readOut(architecture, "server/LeaderStats/init.meta.json");
const parsed = JSON.parse(meta);
expect(!parsed.className, "init.meta.json must not set className", meta);
expect(parsed.properties && parsed.properties.RunContext === "Enum.RunContext.Server", "init.meta.json RunContext.Server", meta);
refuses(meta, ["require(", "GetService", "type DataService"], "init.meta.json must stay pure JSON");

contains(readOut(architecture, "server/LeaderStats/Main.luau"), [
	"require(script.Parent.PlayersManager)",
	"require(script.Parent.CacheController)",
	"function Main.Start()",
	"function Main.Stop()",
	"return Main",
], "architecture Main");
contains(readOut(architecture, "server/LeaderStats/init.server.luau"), ["require(script.Main):Start()"], "architecture boot");
contains(readOut(architecture, "server/LeaderStats/LeaderStatsTypes.luau"), [
	'export type StatName = "Coins" | "Level"',
	"export type LeaderStatsData = {",
	"export type PlayerCache = {",
], "architecture types");

const lifecycle = makeGame({
	"src/shared/Keep.cpp": "const int KEEP = 1;\n",
	"src/shared/Gone.cpp": "const int GONE = 2;\n",
});
expect(buildGame(lifecycle).failed === 0, "lifecycle first build failed");
expect(listOut(lifecycle).includes("shared/Keep.luau") && listOut(lifecycle).includes("shared/Gone.luau"), "first emit missing Keep/Gone");
fs.unlinkSync(path.join(lifecycle, "src", "shared", "Gone.cpp"));
expect(buildGame(lifecycle).failed === 0, "lifecycle prune build failed");
expect(fs.existsSync(path.join(lifecycle, "out", "shared", "Keep.luau")), "Keep.luau was removed");
expect(!fs.existsSync(path.join(lifecycle, "out", "shared", "Gone.luau")), "Gone.luau was not pruned");
expect(fs.existsSync(path.join(lifecycle, "out")), "out/ root must stay for Rojo");

const good = fs.readFileSync(path.join(lifecycle, "out", "shared", "Keep.luau"), "utf8");
writeFile(lifecycle, "src/shared/Keep.cpp", "this is not valid C++ {\n");
const held = buildGame(lifecycle, { holdOnError: true });
expect(held.failed >= 1, "broken source should report a compile error");
expect(fs.readFileSync(path.join(lifecycle, "out", "shared", "Keep.luau"), "utf8") === good, "holdOnError overwrote out/");

const understood = makeGame({
	"src/server/combat.server.cpp": [
		"#pragma strict",
		"#include <cluaupp/roblox.hpp>",
		"void ApplyDamage(Player* player, int amount) {",
		"	auto* character = player->Character;",
		"	if (character == nullptr) { return; }",
		'	auto* humanoid = character->FindFirstChildOfClass("Humanoid");',
		"	if (humanoid == nullptr) { return; }",
		"	humanoid->TakeDamage(amount);",
		"}",
		"void OnPlayer(Player* player) { ApplyDamage(player, 0); }",
		"void init() {",
		"	auto* players = GetService<Players>();",
		"	players->PlayerAdded.Connect(OnPlayer);",
		"}",
		"",
	].join("\n"),
	"src/client/hud.client.cpp": [
		"#pragma strict",
		"#include <cluaupp/roblox.hpp>",
		"void init() {",
		'	auto* playerGui = GetService<Players>()->LocalPlayer->FindFirstChild("PlayerGui");',
		"	auto* screen = new ScreenGui();",
		'	screen->Name = "Hud";',
		"	auto* coins = new TextLabel();",
		'	coins->Name = "Coins";',
		"	coins->Parent = screen;",
		'	print("hud ready");',
		"}",
		"",
	].join("\n"),
	"src/shared/math.cpp": "int Add(int a, int b) { return a + b; }\n",
});
expect(buildGame(understood).failed === 0, "understander sample build failed");
contains(readOut(understood, "server/combat.server.luau"), ["role controller CombatController", 'game:GetService("Players")'], "combat understander");
contains(readOut(understood, "client/hud.client.luau"), ["role controller ViewController"], "hud understander");
contains(readOut(understood, "shared/Math.luau"), ["utility", "MathUtil"], "math understander stays a module");

console.log("Cluaupp out/ structure ok");
console.log(templateTree.join("\n"));
