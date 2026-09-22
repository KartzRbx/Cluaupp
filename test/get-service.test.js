"use strict";

const assert = require("node:assert");
const path = require("node:path");
const svc = require(path.join(__dirname, "..", "generated", "target", "get-service.js"));
const { rewriteClppEmit } = require(path.join(__dirname, "..", "generated", "clpp", "postprocess.js"));

const uses = svc.collectGetServiceUses(`
void init() {
	Players p = GetService<Players>();
	auto ds = GetService("DataStoreService");
	// GetService<FakeService>();
}
`);
assert.strictEqual(uses.length, 2);
assert.strictEqual(uses[0].service, "Players");
assert.strictEqual(uses[1].service, "DataStoreService");

const ok = svc.checkGetService(`void init() { Players p = GetService<Players>(); }`, "x.server.clpp");
assert.strictEqual(ok.length, 0);

const bad = svc.checkGetService(`void init() { auto x = GetService<NotARealServiceZzz>(); }`, "x.server.clpp");
assert.ok(bad.some((d) => /CLUAU_SVC001/.test(d.message) && /NotARealServiceZzz/.test(d.message)));

let threw = false;
try {
	svc.assertGetServiceSafe(`void init() { GetService<NotARealServiceZzz>(); }`, "x.server.clpp");
} catch {
	threw = true;
}
assert.ok(threw);

const luau = rewriteClppEmit(`-- Compiled by CL++\nconst p = GetService<Players>()\n`);
assert.ok(luau.includes('game:GetService("Players")'));
assert.ok(!luau.includes("GetService<Players>"));

console.log("get-service host ok");
