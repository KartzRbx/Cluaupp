"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { writeDefaultProject } = require("../generated/target/gen-rojo-tree");

function at(node, keys) {
	let cur = node;
	for (const key of keys) {
		cur = cur?.[key];
	}
	return cur;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-rojo-"));
for (const rel of [
	"out/Server/Boot/DataBoot.server.luau",
	"out/Client/Controllers/DataController.client.luau",
	"out/Parallel/PathfindingWorker.luau",
	"out/Include/GameTypes.luau",
	"out/Declarations/Net.luau",
	"out/Modules/Combat/CombatService.server.luau",
	"out/Modules/Combat/CombatController.client.luau",
	"out/Modules/Combat/CombatSpecs.luau",
]) {
	const file = path.join(tmp, rel);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, "-- ok\n", "utf8");
}

const projectPath = writeDefaultProject(tmp, "Src", "out");
const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
const tree = project.tree;

assert.strictEqual(at(tree, ["ServerScriptService", "$path"]), "out/Server");
assert.strictEqual(at(tree, ["StarterPlayer", "StarterPlayerScripts", "$path"]), "out/Client");
assert.strictEqual(at(tree, ["ServerScriptService", "Parallel", "$path"]), "out/Parallel");
assert.strictEqual(at(tree, ["ReplicatedStorage", "Include", "$path"]), "out/Include");
assert.strictEqual(at(tree, ["ReplicatedStorage", "Declarations", "$path"]), "out/Declarations");
assert.strictEqual(at(tree, ["ReplicatedStorage", "CluauppLibs", "$path"]), "libs");

assert.strictEqual(
	at(tree, ["ServerScriptService", "Modules", "Combat", "CombatService", "$path"]),
	"out/Modules/Combat/CombatService.server.luau",
);
assert.strictEqual(
	at(tree, ["StarterPlayer", "StarterPlayerScripts", "Modules", "Combat", "CombatController", "$path"]),
	"out/Modules/Combat/CombatController.client.luau",
);
assert.strictEqual(
	at(tree, ["ReplicatedStorage", "Modules", "Combat", "CombatSpecs", "$path"]),
	"out/Modules/Combat/CombatSpecs.luau",
);

fs.rmSync(tmp, { recursive: true, force: true });
console.log("gen-rojo-tree ok");
