"use strict";

const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const cli = path.join(root, "generated", "cli.js");

function run(...args) {
	return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd: root });
}

if (!fs.existsSync(cli)) {
	console.log("skip generator test — run tsc first");
	process.exit(0);
}

const info = run("target", "info");
assert.strictEqual(info.status, 0, info.stderr);
assert.ok(info.stdout.includes('"schemaVersion": 2') || info.stdout.includes('"schemaVersion":2'));

const inspect = run("api", "inspect", "Players");
assert.strictEqual(inspect.status, 0, inspect.stderr);
assert.ok(inspect.stdout.includes("PlayerAdded") || inspect.stdout.includes('"name": "Players"'));

console.log("generator cli smoke passed");
