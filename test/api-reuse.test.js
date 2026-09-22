"use strict";

const assert = require("node:assert");
const path = require("node:path");
const api = require(path.join(__dirname, "..", "generated", "api", "index.js"));

const fixture = path.join(__dirname, "..", "api", "fixtures", "roblox", "mini", "Mini-API-Dump.json");
const aux = path.join(__dirname, "..", "api", "fixtures", "roblox", "aux", "sample.d.luau");
const profile = api.buildRobloxTargetProfile({ dumpPath: fixture, skipValidate: true });
const names = [...Object.keys(profile.classes), ...Object.keys(profile.enums), ...Object.keys(profile.datatypes)];
const report = api.diffAgainstAuxTypes(names, aux);
assert.ok(report.auxSymbols >= 1);
assert.ok(report.onlyInAux.includes("OnlyInAuxPhantom"));
assert.ok(report.onlyInRegistry.length >= 1);

const index = api.buildLspIndex(profile);
assert.strictEqual(index.schemaVersion, 1);
assert.ok(index.classes.Players || index.classes.Instance);
assert.ok(Array.isArray(index.services));

const members = api.listMembers("Players");
assert.ok(Array.isArray(members));

console.log("reuse-first aux-diff + lsp-index ok");
