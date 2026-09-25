"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const {
	collectModuleRefs,
	collectLanguageModulePaths,
	resolveModuleFile,
	rewriteGameRootedRequires,
	ensureGameServices,
	applyNativeHintsToLuau,
	fingerprintSourceWithDeps,
} = require("../generated/clpp/modules");
const { checkAuthority } = require("../generated/target/authority-check");
const { buildProjectGraph } = require("../generated/target/project-graph");
const { RojoMapper } = require("../generated/utils/rojo-mapper");
const { expect, contains, refuses } = require("./helpers");
const { hashText } = require("../generated/target/build-cache");

const sample = `
#include <clpp/roblox.clh>
import { Wallet } from "./PlayerData.clh";
import { PlayerData as Data } from "../Shared/PlayerData.clh";
#include "Legacy.clh"
`;

const refs = collectModuleRefs(sample);
expect(refs.some((r) => r.kind === "import" && r.modulePath.endsWith("PlayerData.clh")), "parse named import");
expect(
	refs.some((r) => r.kind === "import" && r.bindings.some((b) => b.name === "PlayerData" && b.alias === "Data")),
	"parse import as alias",
);
expect(refs.some((r) => r.kind === "include" && r.angled), "angle include still parsed");
expect(collectLanguageModulePaths(sample).length === 3, "three language module paths");

const lang = collectLanguageModulePaths(sample);
expect(lang.includes("./PlayerData.clh"), "lang import path");
expect(lang.includes("Legacy.clh"), "quoted include is language dep");
expect(!lang.some((p) => p.includes("clpp/roblox")), "angle prelude not a language module");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-import-"));
const root = path.join(tmp, "game");
const src = path.join(root, "Src");
const shared = path.join(src, "Include");
const boot = path.join(src, "Server", "Boot");
fs.mkdirSync(shared, { recursive: true });
fs.mkdirSync(boot, { recursive: true });
fs.writeFileSync(
	path.join(shared, "PlayerData.clh"),
	`#pragma once
struct Wallet { int Coins = 0; };
struct PlayerData { int Money = 0; };
`,
);
fs.writeFileSync(
	path.join(boot, "Boot.server.clpp"),
		`#include <clpp/roblox.clh>
import { Wallet, PlayerData as Data } from "../../Include/PlayerData.clh";

void init() {
	Wallet w;
	Data d;
	post(w.Coins);
}
`,
);
fs.writeFileSync(
	path.join(root, "default.project.json"),
	JSON.stringify({
		name: "import-test",
		tree: {
			$className: "DataModel",
			ReplicatedStorage: { $path: "out/Include" },
			ServerScriptService: { $path: "out/Server" },
		},
	}),
);

const fromBoot = path.join(boot, "Boot.server.clpp");
const resolved = resolveModuleFile(
	"../../Include/PlayerData.clh",
	fromBoot,
	src,
);
expect(resolved && resolved.replace(/\\/g, "/").endsWith("Include/PlayerData.clh"), "resolve relative import", resolved);

const graph = buildProjectGraph(root, "Src");
expect(graph.edges.some((e) => e.from.includes("Boot.server.clpp") && e.to.includes("PlayerData.clh")), "graph edge import", JSON.stringify(graph.edges));

const auth = checkAuthority(
	`import { X } from "../../ServerScriptService/Secret.clh";\nvoid init() {}\n`,
	"StarterPlayer/StarterPlayerScripts/Controllers/Bad.client.clpp",
);
expect(auth.some((d) => d.code === "CLUAU_AUTH001"), "AUTH001 on client import of SSS");

const mapper = new RojoMapper(path.join(root, "default.project.json"), src, "out");
mapper.loadSync();
const binding = mapper.resolveImportToRequire("../../Include/PlayerData.clh", fromBoot);
expect(binding && binding.path.includes("ReplicatedStorage"), "rojo import binding", JSON.stringify(binding));

const rewritten = ensureGameServices(
	rewriteGameRootedRequires(
		`const PlayerData = require(script.Parent.Parent.Parent.ReplicatedStorage.Shared.PlayerData)\n`,
	),
);
contains(rewritten, ["require(ReplicatedStorage.Shared.PlayerData)", 'GetService("ReplicatedStorage")'], "game-rooted require rewrite");
refuses(rewritten, ["script.Parent.Parent.Parent.ReplicatedStorage"], "no Parent walk");

const hinted = applyNativeHintsToLuau(
	`function Hot()\n\treturn 1\nend\n`,
	["Hot"],
);
contains(hinted, ["@native", "function Hot()"], "nativeHints apply");

const h1 = fingerprintSourceWithDeps(
	fs.readFileSync(fromBoot, "utf8"),
	fromBoot,
	"cfg",
	src,
	hashText,
);
fs.appendFileSync(path.join(shared, "PlayerData.clh"), "\n// touch\n");
const h2 = fingerprintSourceWithDeps(
	fs.readFileSync(fromBoot, "utf8"),
	fromBoot,
	"cfg",
	src,
	hashText,
);
expect(h1 !== h2, "dep fingerprint invalidates when imported header changes");

fs.rmSync(tmp, { recursive: true, force: true });
console.log("cluaupp named import host ok");
