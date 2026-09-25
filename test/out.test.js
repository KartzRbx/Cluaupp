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
	"Include/GameTypes.luau",
	"Server/Boot/DataBoot.server.luau",
	"Modules/Core/PlayerHandler.server.luau",
	"Modules/Core/Guard.server.luau",
	"Client/Controllers/DataController.client.luau",
	"Client/Main.client.luau",
]) {
	expect(templateTree.includes(expected), `template missing ${expected}`, templateTree.join("\n"));
}

const dataBoot = readOut(template, "Server/Boot/DataBoot.server.luau");
contains(dataBoot, ["Keep.Server:Init", "PlayerData", "init()"], "DataBoot.server.luau");
refuses(dataBoot, ["require(script.Main)", "DataController", "ClppLibs."], "DataBoot extras");

const handler = readOut(template, "Modules/Core/PlayerHandler.server.luau");
contains(handler, ["WaitFor", "leaderstats", "PlayerAdded"], "PlayerHandler.server.luau");

const client = readOut(template, "Client/Controllers/DataController.client.luau");
contains(client, ["Keep.Client:Init", "init()"], "DataController.client.luau");

const templateData = readOut(template, "Include/GameTypes.luau");
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
	"Src/Include/Keep.clp": "const int KEEP = 1;\n",
	"Src/Include/Gone.clp": "const int GONE = 2;\n",
});
expect(buildGame(lifecycle).failed === 0, "lifecycle first build failed");
expect(
	listOut(lifecycle).includes("Include/Keep.luau") && listOut(lifecycle).includes("Include/Gone.luau"),
	"first emit missing Keep/Gone",
	listOut(lifecycle).join("\n"),
);
fs.unlinkSync(path.join(lifecycle, "Src", "Include", "Gone.clp"));
expect(buildGame(lifecycle).failed === 0, "lifecycle prune build failed");
expect(fs.existsSync(path.join(lifecycle, "out", "Include", "Keep.luau")), "Keep.luau was removed");
expect(!fs.existsSync(path.join(lifecycle, "out", "Include", "Gone.luau")), "Gone.luau was not pruned");
expect(fs.existsSync(path.join(lifecycle, "out")), "out/ root must stay for Rojo");

const good = fs.readFileSync(path.join(lifecycle, "out", "Include", "Keep.luau"), "utf8");
writeFile(lifecycle, "Src/Include/Keep.clp", "this is not valid CL++ {\n");
const held = buildGame(lifecycle, { holdOnError: true });
expect(held.failed >= 1, "broken source should report a compile error");
expect(fs.readFileSync(path.join(lifecycle, "out", "Include", "Keep.luau"), "utf8") === good, "holdOnError overwrote out/");

const sample = makeGame({
	"Src/Modules/Combat/Combat.server.clpp": `#include <clpp/roblox.clh>

void OnHit(Player player) {
	post(player.Name);
}

void init() {
	Players players = GetService<Players>();
	players.PlayerAdded~>Connect(OnHit);
}
`,
	"Src/Client/UI/Hud.client.clpp": `#include <clpp/roblox.clh>

void init() {
	post("hud ready");
}
`,
	"Src/Modules/Shared/Math.clp": "int Add(int a, int b) { return a + b; }\n",
});
expect(buildGame(sample).failed === 0, "sample game build failed", listOut(sample).join("\n"));
contains(readOut(sample, "Modules/Combat/Combat.server.luau"), ['game:GetService("Players")', "OnHit"], "combat GetService / signal");
contains(readOut(sample, "Client/UI/Hud.client.luau"), ["hud ready"], "hud emit");
contains(readOut(sample, "Modules/Shared/Math.luau"), ["Add"], "math module");
refuses(readOut(sample, "Modules/Combat/Combat.server.luau"), ["require(ClppLibs."], "combat postprocess ClppLibs");

console.log("Cluaupp out/ structure ok");
console.log(templateTree.join("\n"));
