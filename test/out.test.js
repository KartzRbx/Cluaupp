"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, writeFile, makeGame, copyTemplateGame, buildGame, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const template = copyTemplateGame({ strict: false });
const templateBuild = buildGame(template);
expect(templateBuild.failed === 0, `template build failed (${templateBuild.failed})`, listOut(template).join("\n"));

const templateTree = listOut(template);
for (const expected of [
	"ReplicatedStorage/Shared/Constants/Datas/TemplateData.luau",
	"ServerScriptService/Boot/DataBoot.server.luau",
	"ServerScriptService/Handlers/PlayerHandler.server.luau",
	"ServerScriptService/Configuration/ServerConfig.luau",
	"StarterPlayer/StarterPlayerScripts/Controllers/DataController.client.luau",
	"StarterPlayer/StarterCharacterScripts/Character/CharacterReady.client.luau",
]) {
	expect(templateTree.includes(expected), `template missing ${expected}`, templateTree.join("\n"));
}

const dataBoot = readOut(template, "ServerScriptService/Boot/DataBoot.server.luau");
contains(dataBoot, ["Keep.Server:Init", "PlayerData", "init()"], "DataBoot.server.luau");
refuses(dataBoot, ["require(script.Main)", "DataController", "ClppLibs."], "DataBoot extras");

const handler = readOut(template, "ServerScriptService/Handlers/PlayerHandler.server.luau");
contains(handler, ["WaitFor", "leaderstats", "PlayerAdded"], "PlayerHandler.server.luau");

const client = readOut(template, "StarterPlayer/StarterPlayerScripts/Controllers/DataController.client.luau");
contains(client, ["Keep.Client:Init", "init()"], "DataController.client.luau");

const templateData = readOut(template, "ReplicatedStorage/Shared/Constants/Datas/TemplateData.luau");
contains(templateData, ["Currencies", "Coins"], "TemplateData.luau");

for (const [file, kind, outName] of [
	["ServerScriptService/combat.server.clpp", "flat", "ServerScriptService/combat.server.luau"],
	["StarterPlayer/StarterPlayerScripts/shop.client.clpp", "flat", "StarterPlayer/StarterPlayerScripts/shop.client.luau"],
	["ReplicatedStorage/Shared/damage.clp", "module", "ReplicatedStorage/Shared/damage.luau"],
	["ServerScriptService/boot.legacy.server.clpp", "legacy", "ServerScriptService/boot.legacy.server.luau"],
	["tools.plugin.clpp", "flat", "tools.plugin.luau"],
]) {
	const src = file.includes("damage")
		? "int DamageOf(int base) { return base; }\n"
		: "void init() { post(\"ok\"); }\n";
	const result = compileService(src, file, { relativeName: file, strict: true });
	expect(result.kind === kind, `${file} kind ${result.kind}, expected ${kind}`);
	const name = result.files[0].name.replace(/\\/g, "/");
	expect(name === outName, `${file} → ${name}, expected ${outName}`);
}

const lifecycle = makeGame({
	"src/ReplicatedStorage/Shared/Keep.clp": "const int KEEP = 1;\n",
	"src/ReplicatedStorage/Shared/Gone.clp": "const int GONE = 2;\n",
});
expect(buildGame(lifecycle).failed === 0, "lifecycle first build failed");
expect(
	listOut(lifecycle).includes("ReplicatedStorage/Shared/Keep.luau") && listOut(lifecycle).includes("ReplicatedStorage/Shared/Gone.luau"),
	"first emit missing Keep/Gone",
	listOut(lifecycle).join("\n"),
);
fs.unlinkSync(path.join(lifecycle, "src", "ReplicatedStorage", "Shared", "Gone.clp"));
expect(buildGame(lifecycle).failed === 0, "lifecycle prune build failed");
expect(fs.existsSync(path.join(lifecycle, "out", "ReplicatedStorage", "Shared", "Keep.luau")), "Keep.luau was removed");
expect(!fs.existsSync(path.join(lifecycle, "out", "ReplicatedStorage", "Shared", "Gone.luau")), "Gone.luau was not pruned");
expect(fs.existsSync(path.join(lifecycle, "out")), "out/ root must stay for Rojo");

const good = fs.readFileSync(path.join(lifecycle, "out", "ReplicatedStorage", "Shared", "Keep.luau"), "utf8");
writeFile(lifecycle, "src/ReplicatedStorage/Shared/Keep.clp", "this is not valid CL++ {\n");
const held = buildGame(lifecycle, { holdOnError: true });
expect(held.failed >= 1, "broken source should report a compile error");
expect(fs.readFileSync(path.join(lifecycle, "out", "ReplicatedStorage", "Shared", "Keep.luau"), "utf8") === good, "holdOnError overwrote out/");

const sample = makeGame({
	"src/ServerScriptService/Handlers/Combat.server.clpp": `#include <clpp/roblox.clh>

void OnHit(Player player) {
	post(player.Name);
}

void init() {
	Players players = GetService<Players>();
	players.PlayerAdded~>Connect(OnHit);
}
`,
	"src/StarterPlayer/StarterPlayerScripts/UI/Hud.client.clpp": `#include <clpp/roblox.clh>

void init() {
	post("hud ready");
}
`,
	"src/ReplicatedStorage/Shared/Utils/Math.clp": "int Add(int a, int b) { return a + b; }\n",
});
expect(buildGame(sample).failed === 0, "sample game build failed", listOut(sample).join("\n"));
contains(readOut(sample, "ServerScriptService/Handlers/Combat.server.luau"), ['game:GetService("Players")', "OnHit"], "combat GetService / signal");
contains(readOut(sample, "StarterPlayer/StarterPlayerScripts/UI/Hud.client.luau"), ["hud ready"], "hud emit");
contains(readOut(sample, "ReplicatedStorage/Shared/Utils/Math.luau"), ["Add"], "math module");
refuses(readOut(sample, "ServerScriptService/Handlers/Combat.server.luau"), ["require(ClppLibs."], "combat postprocess ClppLibs");

console.log("Cluaupp out/ structure ok");
console.log(templateTree.join("\n"));
