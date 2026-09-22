#!/usr/bin/env node
/**
 * Reproducible site benchmarks (registry + example game build).
 * Usage: node scripts/bench-site.cjs
 */
"use strict";

const { performance } = require("node:perf_hooks");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const api = require("../generated/api/index.js");

const root = path.join(__dirname, "..");
const game = path.join(root, "examples", "game");
const cli = path.join(root, "generated", "cli.js");

function ms(n) {
	return Math.round(n);
}

function registryBench() {
	const t0 = performance.now();
	const p = api.buildRobloxTargetProfile({ skipValidate: true });
	const t1 = performance.now();
	api.buildRegistry(p);
	const t2 = performance.now();
	api.buildLspIndex(p);
	const t3 = performance.now();

	let props = 0;
	let methods = 0;
	let events = 0;
	let ts = 0;
	let services = 0;
	for (const c of Object.values(p.classes)) {
		if (c.service) services++;
		for (const m of Object.values(c.properties || {})) {
			props++;
			if (m.threadSafety) ts++;
		}
		for (const m of Object.values(c.methods || {})) {
			methods++;
			if (m.threadSafety) ts++;
		}
		for (const m of Object.values(c.events || {})) {
			events++;
			if (m.threadSafety) ts++;
		}
		for (const m of Object.values(c.callbacks || {})) {
			if (m.threadSafety) ts++;
		}
	}

	return {
		classes: Object.keys(p.classes).length,
		enums: Object.keys(p.enums).length,
		datatypes: Object.keys(p.datatypes || {}).length,
		services,
		props,
		methods,
		events,
		threadSafety: ts,
		buildMs: ms(t1 - t0),
		regMs: ms(t2 - t1),
		lspMs: ms(t3 - t2),
		totalMs: ms(t3 - t0),
	};
}

function buildOnce(args) {
	const t0 = performance.now();
	const r = spawnSync(process.execPath, [cli, "build", game, ...args], {
		encoding: "utf8",
		cwd: root,
	});
	const elapsed = ms(performance.now() - t0);
	const out = `${r.stdout || ""}\n${r.stderr || ""}`;
	const cacheHit = /incremental cache hit (\d+)\/(\d+)/.exec(out);
	return {
		ms: elapsed,
		status: r.status,
		cacheHit: cacheHit ? `${cacheHit[1]}/${cacheHit[2]}` : null,
		parallel: /parallel compile jobs=(\d+)/.exec(out)?.[1] || null,
	};
}

function gameBench() {
	const cacheDir = path.join(game, ".cluaupp", "compile-cache");
	fs.rmSync(cacheDir, { recursive: true, force: true });
	const cold = buildOnce(["--no-incremental"]);
	const fill = buildOnce([]); // write cache
	const warm = buildOnce([]);
	return { cold, fill, warm };
}

const registry = registryBench();
const gameBuild = gameBench();
const report = {
	measuredAt: new Date().toISOString(),
	node: process.version,
	platform: process.platform,
	registry,
	gameBuild,
};
console.log(JSON.stringify(report, null, "\t"));
fs.mkdirSync(path.join(root, "api", "generated"), { recursive: true });
fs.writeFileSync(path.join(root, "api", "generated", "bench-latest.json"), JSON.stringify(report, null, "\t") + "\n");
