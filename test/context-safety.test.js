"use strict";

const assert = require("node:assert");
const path = require("node:path");
const ctx = require(path.join(__dirname, "..", "generated", "target", "context-check.js"));
const caps = require(path.join(__dirname, "..", "generated", "target", "capabilities.js"));

const serverBad = `#include <clpp/roblox.clh>
void init() {
	Players players = GetService<Players>();
	Player me = players.LocalPlayer;
}
`;
const serverViolations = ctx.checkContextSafety(serverBad, "Boot.server.clpp");
assert.ok(serverViolations.some((v) => v.code === "CLUAUPP_CTX_LOCALPLAYER" && v.severity === "error"));

const clientOk = `#include <clpp/roblox.clh>
void init() {
	Players players = GetService<Players>();
	Player me = players.LocalPlayer;
}
`;
const clientViolations = ctx.checkContextSafety(clientOk, "Hud.client.clpp").filter((v) => v.severity === "error");
assert.strictEqual(clientViolations.length, 0);

const clientDataStore = `void init() {
	auto ds = GetService<DataStoreService>();
}
`;
const dsViolations = ctx.checkContextSafety(clientDataStore, "Bad.client.clpp");
assert.ok(dsViolations.some((v) => v.code === "CLUAUPP_CTX_DATASTORE"));

const commented = `void init() {
	// players.LocalPlayer
	post("ok");
}
`;
assert.strictEqual(ctx.checkContextSafety(commented, "X.server.clpp").filter((v) => v.severity === "error").length, 0);

const fireServerOnServer = `void init() {
	Net.Hit.FireServer(target, 1);
}
`;
assert.ok(ctx.checkContextSafety(fireServerOnServer, "Combat.server.clpp").some((v) => v.code === "CLUAUPP_CTX_FIRE_SERVER"));

assert.ok(caps.builtinCapabilityProfile().rules.length >= 5);

let threw = false;
try {
	ctx.assertContextSafe(serverBad, "Boot.server.clpp");
} catch {
	threw = true;
}
assert.ok(threw);

console.log("context-safety ok");
