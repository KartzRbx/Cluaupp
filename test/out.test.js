"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, writeFile, makeGame, copyTemplateGame, buildGame, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const template = copyTemplateGame({ strict: false });
const templateBuild = buildGame(template);
expect(templateBuild.failed === 0, `template build failed (${templateBuild.failed})`);

const templateTree = listOut(template);
expect(
	JSON.stringify(templateTree) === JSON.stringify([
		"client/init.client.luau",
		"server/leaderstats.server.luau",
		"shared/config.luau",
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
contains(config, ["STARTING_COINS"], "config.clp module");

for (const [file, kind, outName] of [
	["server/combat.server.clpp", "flat", "server/combat.server.luau"],
	["client/shop.client.clpp", "flat", "client/shop.client.luau"],
	["shared/damage.clp", "module", "shared/damage.luau"],
	["server/boot.legacy.server.clpp", "legacy", "server/boot.legacy.server.luau"],
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
	"src/shared/Keep.clp": "const int KEEP = 1;\n",
	"src/shared/Gone.clp": "const int GONE = 2;\n",
});
expect(buildGame(lifecycle).failed === 0, "lifecycle first build failed");
expect(listOut(lifecycle).includes("shared/Keep.luau") && listOut(lifecycle).includes("shared/Gone.luau"), "first emit missing Keep/Gone");
fs.unlinkSync(path.join(lifecycle, "src", "shared", "Gone.clp"));
expect(buildGame(lifecycle).failed === 0, "lifecycle prune build failed");
expect(fs.existsSync(path.join(lifecycle, "out", "shared", "Keep.luau")), "Keep.luau was removed");
expect(!fs.existsSync(path.join(lifecycle, "out", "shared", "Gone.luau")), "Gone.luau was not pruned");
expect(fs.existsSync(path.join(lifecycle, "out")), "out/ root must stay for Rojo");

const good = fs.readFileSync(path.join(lifecycle, "out", "shared", "Keep.luau"), "utf8");
writeFile(lifecycle, "src/shared/Keep.clp", "this is not valid CL++ {\n");
const held = buildGame(lifecycle, { holdOnError: true });
expect(held.failed >= 1, "broken source should report a compile error");
expect(fs.readFileSync(path.join(lifecycle, "out", "shared", "Keep.luau"), "utf8") === good, "holdOnError overwrote out/");

const sample = makeGame({
	"src/server/combat.server.clpp": fs.readFileSync(path.join(__dirname, "..", "examples", "game", "src", "server", "combat.server.clpp"), "utf8"),
	"src/client/hud.client.clpp": fs.readFileSync(path.join(__dirname, "..", "examples", "game", "src", "client", "hud.client.clpp"), "utf8"),
	"src/shared/math.clp": "int Add(int a, int b) { return a + b; }\n",
});
expect(buildGame(sample).failed === 0, "sample game build failed", listOut(sample).join("\n"));
contains(readOut(sample, "server/combat.server.luau"), ['game:GetService("Players")', "OnHit"], "combat GetService / signal");
contains(readOut(sample, "client/hud.client.luau"), ["hud ready"], "hud emit");
contains(readOut(sample, "shared/math.luau"), ["Add"], "math module");
refuses(readOut(sample, "server/combat.server.luau"), ["require(ClppLibs."], "combat postprocess ClppLibs");

console.log("Cluaupp out/ structure ok");
console.log(templateTree.join("\n"));
