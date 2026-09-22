"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function main() {
	const root = path.join(__dirname, "..");
	const cache = require(path.join(root, "generated", "target", "build-cache.js"));
	const apply = require(path.join(root, "generated", "target", "optimizer-apply.js"));
	const pgo = require(path.join(root, "generated", "target", "pgo.js"));
	const docs = require(path.join(root, "generated", "target", "project-docs.js"));
	const flareParse = require(path.join(root, "generated", "flare", "parse.js"));
	const check = require(path.join(root, "generated", "target", "datamodel-check.js"));
	const dm = require(path.join(root, "generated", "target", "datamodel.js"));

	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-cache-"));
	const rel = "ServerScriptService/Boot.server.clpp";
	const hash = cache.fingerprintSource("void init() {}\n", '{"strict":false}');
	assert.ok(!cache.readCachedJob(tmp, rel, hash));
	cache.writeCachedJob(tmp, {
		rel,
		sourceHash: hash,
		files: [{ name: "ServerScriptService/Boot.server.luau", contents: "--ok\n" }],
		stale: [],
	});
	const hit = cache.readCachedJob(tmp, rel, hash);
	assert.ok(hit);
	assert.strictEqual(hit.files[0].contents, "--ok\n");
	assert.ok(!cache.readCachedJob(tmp, rel, "other"));

	const out = await cache.mapPool([1, 2, 3, 4], 2, async (n) => n * 2);
	assert.deepStrictEqual(out, [2, 4, 6, 8]);

	const hotSrc = `
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
`;
	const applied = apply.applyOptimizerHints(hotSrc, "sim.clpp");
	assert.ok(typeof applied.source === "string");

	const profileFile = pgo.writeProfileTemplate(tmp);
	assert.ok(fs.existsSync(profileFile));
	const profile = pgo.loadProfile(profileFile);
	assert.ok(profile && profile.hot);

	fs.writeFileSync(
		path.join(tmp, "default.project.json"),
		JSON.stringify({
			name: "docs-fix",
			tree: { $className: "DataModel", ReplicatedStorage: { $className: "ReplicatedStorage" } },
		}),
	);
	fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
	const { outPath, markdown } = docs.generateProjectDocs(tmp);
	assert.ok(fs.existsSync(outPath));
	assert.ok(markdown.includes("DataModel"));

	const schema = flareParse.parseFlare(`version 3;\npacket Ping() from Client\n`, "Net.flare", "Net");
	assert.strictEqual(schema.version, 3);
	assert.strictEqual(schema.packets[0].name, "Ping");

	const goldenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-golden-"));
	fs.writeFileSync(
		path.join(goldenRoot, "default.project.json"),
		JSON.stringify({
			name: "golden",
			tree: {
				$className: "DataModel",
				ReplicatedStorage: {
					$className: "ReplicatedStorage",
					Shared: { $className: "Folder", Net: { $className: "Folder" } },
				},
			},
		}),
	);
	const gProfile = dm.buildDatamodelProfile(goldenRoot);
	assert.ok(gProfile);
	const goldenOk = `void init() {
	auto shared = GetService<ReplicatedStorage>().WaitForChild("Shared");
	auto net = shared.WaitForChild("Net");
}
`;
	assert.strictEqual(check.checkDatamodelPaths(goldenOk, gProfile).length, 0);
	const goldenBad = `void init() {
	auto shared = GetService<ReplicatedStorage>().WaitForChild("Shared");
	auto net = shared.WaitForChild("Nope");
}
`;
	assert.ok(check.checkDatamodelPaths(goldenBad, gProfile).some((v) => /Nope/.test(v.message)));

	const stamp = require(path.join(root, "generated", "target", "luau-stamp.js"));
	const stamped = stamp.stampLuauFromClpp("--!strict\nlocal x = 1\n", "src/Foo.server.clpp", "#pragma native\nvoid init() {}\n");
	assert.ok(stamped.includes("cluaupp-source: src/Foo.server.clpp"));
	assert.ok(stamped.includes("--!native"));

	const eventsFile = path.join(tmp, "hits.jsonl");
	fs.writeFileSync(eventsFile, '{"symbol":"CalculatePhysics","count":5}\n{"symbol":"EnemyState","kind":"struct","count":2}\n');
	const ingested = pgo.ingestProfile(tmp, eventsFile);
	assert.strictEqual(ingested.merged, 2);
	assert.strictEqual(ingested.profile.hot.CalculatePhysics, 5);
	assert.strictEqual(ingested.profile.structs.EnemyState, 2);

	const authGraph = require(path.join(root, "generated", "target", "authority-graph.js"));
	const authTmp = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-auth-"));
	fs.mkdirSync(path.join(authTmp, "src", "StarterPlayer", "StarterPlayerScripts"), { recursive: true });
	fs.mkdirSync(path.join(authTmp, "src", "ServerScriptService"), { recursive: true });
	fs.writeFileSync(
		path.join(authTmp, "src", "ServerScriptService", "Secret.clh"),
		"#pragma once\nstruct Secret {}\n",
	);
	fs.writeFileSync(
		path.join(authTmp, "src", "StarterPlayer", "StarterPlayerScripts", "Hud.client.clpp"),
		'#include "Secret.clh"\nvoid init() {}\n',
	);
	const graphDiags = authGraph.checkAuthorityGraph(authTmp);
	assert.ok(graphDiags.some((d) => d.code === "CLUAU_AUTH004"), JSON.stringify(graphDiags));

	const soa = require(path.join(root, "generated", "target", "optimizer-soa.js"));
	const hotStruct = `
struct EnemyState {
	float Health = 100;
	float Speed = 16;
	Vector3 Position;
	int TargetId = 0;
};
`;
	const layout = soa.applyLayoutPragmas(hotStruct, "sim.clpp");
	assert.ok(/#pragma\s+layout\s+soa\s+EnemyState/.test(layout.source));
	assert.ok(layout.plans.some((p) => p.structName === "EnemyState"));
	const luau = soa.generateSoaLuau(layout.plans[0], false);
	assert.ok(luau.includes("EnemyStateSoa.new"));
	assert.ok(luau.includes("Health"));
	const bufLuau = soa.generateSoaLuau(layout.plans[0], true);
	assert.ok(bufLuau.includes("buffer.writef32") || bufLuau.includes("buffer.create"));

	const bridge = require(path.join(root, "generated", "target", "studio-bridge.js"));
	await new Promise((resolve, reject) => {
		const server = bridge.startStudioBridge({ port: 0 });
		// port 0 may not work if listen assigns later — use high port
		server.close();
		const s2 = bridge.startStudioBridge({ port: 38479, projectRoot: tmp });
		const http = require("node:http");
		const body = JSON.stringify({ type: "open", path: "src/Foo.clpp", line: 3 });
		const req = http.request(
			{ hostname: "127.0.0.1", port: 38479, path: "/open", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
			(res) => {
				let data = "";
				res.on("data", (c) => (data += c));
				res.on("end", () => {
					try {
						assert.ok(JSON.parse(data).ok);
						http.get("http://127.0.0.1:38479/events?since=0", (r2) => {
							let d2 = "";
							r2.on("data", (c) => (d2 += c));
							r2.on("end", () => {
								try {
									const ev = JSON.parse(d2).events;
									assert.ok(ev.some((e) => e.path === "src/Foo.clpp"));
									s2.close();
									resolve();
								} catch (e) {
									s2.close();
									reject(e);
								}
							});
						}).on("error", (e) => {
							s2.close();
							reject(e);
						});
					} catch (e) {
						s2.close();
						reject(e);
					}
				});
			},
		);
		req.on("error", (e) => {
			s2.close();
			reject(e);
		});
		req.write(body);
		req.end();
	});

	fs.rmSync(tmp, { recursive: true, force: true });
	fs.rmSync(goldenRoot, { recursive: true, force: true });
	fs.rmSync(authTmp, { recursive: true, force: true });
	console.log("platform-extras ok");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
