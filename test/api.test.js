"use strict";

const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");

// Prefer generated JS; fall back to tsx-less path after tsc
const root = path.join(__dirname, "..");
const api = require(path.join(root, "generated", "api", "index.js"));

function test(name, fn) {
	try {
		fn();
		console.log("ok", name);
	} catch (err) {
		console.error("FAIL", name);
		throw err;
	}
}

test("build profile has classes and enums", () => {
	const profile = api.buildRobloxTargetProfile({ skipValidate: true });
	assert.strictEqual(profile.schemaVersion, 2);
	assert.ok(Object.keys(profile.classes).length > 100);
	assert.ok(Object.keys(profile.enums).length > 100);
	assert.ok(profile.datatypes.Vector3);
	assert.ok(profile.services.Players || profile.classes.Players?.service || profile.classes.Players?.creation?.service);
});

test("Players.PlayerAdded has typed parameters", () => {
	const profile = api.buildRobloxTargetProfile({ skipValidate: true });
	const players = profile.classes.Players;
	assert.ok(players);
	const ev = players.events.find((e) => e.name === "PlayerAdded");
	assert.ok(ev, "PlayerAdded event");
	assert.ok(ev.parameters.length >= 1);
	assert.strictEqual(ev.parameters[0].type.kind, "Class");
	assert.strictEqual(ev.parameters[0].type.name, "Player");
});

test("registry indexes and search", () => {
	const profile = api.buildRobloxTargetProfile({ skipValidate: true });
	const registry = api.buildRegistry(profile);
	assert.ok(registry.classes.has("Instance"));
	assert.ok(registry.members.has("Instance.Name") || registry.properties.has("Instance.Name"));
	const hits = api.searchRegistry(registry, "PlayerAdded");
	assert.ok(hits.length >= 1);
});

test("diff identical profiles is empty", () => {
	const profile = api.buildRobloxTargetProfile({ skipValidate: true });
	assert.deepStrictEqual(api.diffProfiles(profile, profile), []);
});

test("coverage report", () => {
	const report = api.apiCoverage();
	assert.ok(report.classes > 0);
	assert.ok(typeof report.coveragePercent === "number");
});

test("BasePart.Position carries ThreadSafety from dump", () => {
	const profile = api.buildRobloxTargetProfile({ skipValidate: true });
	const prop = profile.classes.BasePart?.properties.find((p) => p.name === "Position");
	assert.ok(prop);
	assert.ok(prop.threadSafety === "ReadSafe" || prop.threadSafety === "Safe" || prop.threadSafety);
});

test("fixture mini dump loader", () => {
	const fixture = path.join(root, "api", "fixtures", "roblox", "mini", "Mini-API-Dump.json");
	if (fs.existsSync(fixture)) {
		const loaded = api.loadMiniDump(fixture);
		assert.ok(Array.isArray(loaded.data.Classes));
		assert.ok(loaded.meta.hash);
	} else {
		const loaded = api.loadMiniDump();
		assert.ok(loaded.meta.hash);
	}
});

console.log("api tests passed");
