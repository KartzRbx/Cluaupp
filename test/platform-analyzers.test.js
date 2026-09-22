"use strict";

const assert = require("node:assert");
const path = require("node:path");
const par = require(path.join(__dirname, "..", "generated", "target", "parallel-check.js"));
const auth = require(path.join(__dirname, "..", "generated", "target", "authority-check.js"));
const opt = require(path.join(__dirname, "..", "generated", "target", "optimizer-advise.js"));
const life = require(path.join(__dirname, "..", "generated", "target", "lifetime-check.js"));
const sec = require(path.join(__dirname, "..", "generated", "target", "security-check.js"));

const parallelBad = `
void init() {
	parallel {
		part.Parent = null;
		part.Destroy();
	}
}
`;
assert.ok(par.checkParallelSafety(parallelBad, "X.server.clpp").some((d) => d.code === "CLUAU_PAR001"));

const authBad = `
#include "ServerScriptService/Secret.clh"
void init() {}
`;
assert.ok(auth.checkAuthority(authBad, "Hud.client.clpp").some((d) => d.code === "CLUAU_AUTH001"));

const advice = opt.adviseOptimizer(`
struct EnemyState {
	float Health = 100;
	float Speed = 16;
	Vector3 Position;
	int TargetId = 0;
};
void CalculatePhysics() {
	float a = 1.0;
	float b = 2.0;
	float c = a * b + a / b * a + b * a + a * a;
	float d = c * a + b * b + a / c;
	float e = d * c + a * b + sin(a) + cos(b) + sqrt(c);
	float f = e * d + c * b + a;
	post(f);
}
`, "sim.clpp");
assert.ok(advice.some((a) => a.kind === "storage"), JSON.stringify(advice));
assert.ok(advice.some((a) => a.kind === "native" || a.kind === "parallel"), JSON.stringify(advice));

assert.ok(life.checkLifetime(`players.PlayerAdded.Connect(fn);`, "X.server.clpp").some((d) => d.code === "CLUAU_LIFE001"));
assert.ok(sec.checkSecurity(`void init() { Coins = 999; }`, "Hack.client.clpp").some((d) => d.code === "CLUAU_SEC001"));

console.log("platform-analyzers ok");
