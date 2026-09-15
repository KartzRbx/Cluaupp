"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { compileSource } = require("../src/compile");

const runtime = path.join(__dirname, "..", "runtime");
const includeLibs = path.join(__dirname, "..", "include", "cluaupp", "libs");

function exists(rel) {
	return fs.existsSync(path.join(runtime, rel));
}

function read(rel) {
	return fs.readFileSync(path.join(runtime, rel), "utf8");
}

const missing = [];
function mustExist(rel) {
	if (!exists(rel)) {
		missing.push(`missing ${rel}`);
	}
}

function mustContain(rel, snippet) {
	mustExist(rel);
	if (exists(rel) && !read(rel).includes(snippet)) {
		missing.push(`${rel} missing ${JSON.stringify(snippet)}`);
	}
}

function mustNotContain(rel, snippet) {
	mustExist(rel);
	if (exists(rel) && read(rel).includes(snippet)) {
		missing.push(`${rel} must not contain ${JSON.stringify(snippet)}`);
	}
}

const publicInits = [
	"Janitor/init.luau",
	"Promise/init.luau",
	"Net/init.luau",
	"MathUtils/init.luau",
	"Twinkle/init.luau",
	"VfxUtil/init.luau",
	"StickyBillboard/init.luau",
	"ArrayIndexer/init.luau",
	"Occlude/init.luau",
	"DataService/init.luau",
	"Fusion/init.luau",
	"Iris/init.luau",
	"Cmdr/init.luau",
	"Chrono/init.luau",
	"FormatNumber/init.luau",
	"TopbarPlus/init.luau",
	"EzVisualz/init.luau",
	"StateMachine/init.luau",
	"Module3D/init.luau",
	"Spring/init.luau",
	"Display/init.luau",
];

for (const rel of publicInits) {
	mustContain(rel, "--!strict");
	mustContain(rel, "export type");
	mustNotContain(rel, "WaitForChild(\"CluauppLibs\")");
}

mustNotContain("DataService/init.luau", "path: any");
mustContain("Janitor/init.luau", "export type Janitor");
mustContain("Promise/init.luau", "export type Promise");
mustContain("Promise/_impl/init.lua", "Promise.prototype.Then = Promise.prototype.andThen");
mustContain("Net/init.luau", "export type Event");
mustContain("ArrayIndexer/init.luau", "export type function Table");
mustContain("Occlude/init.luau", "export type function Keys");
mustContain("MathUtils/init.luau", "export type MathUtils");
mustContain("Twinkle/init.luau", "export type Twinkle");
mustContain("VfxUtil/init.luau", "export type EffectInstance");
mustContain("StickyBillboard/init.luau", "export type StickyBillboard");
mustContain("DataService/init.luau", "export type ServerApi");
mustContain("DataService/init.luau", "GetChangedSignal");
mustContain("Fusion/init.luau", "export type Scope");
mustContain("FormatNumber/init.luau", "Abbreviate");
mustExist("Janitor/_impl/init.luau");
mustExist("Promise/_impl/init.lua");
mustExist("Fusion/_impl/Memory/scoped.luau");
mustExist("Iris/_impl/widgets/Window.lua");
mustExist("Cmdr/_impl/BuiltInCommands/help.luau");
mustExist("Chrono/_impl/Server/Replicate.luau");
mustExist("DataService/ProfileStore.luau");
mustExist("DataService/Packages/quicknet/QuickNet.luau");
mustExist("EzVisualz/_impl/Presets/Rainbow.luau");
mustExist("StateMachine/_impl/init.lua");
mustExist("Spring/_impl/init.luau");
mustExist("Display/_impl/init.luau");
mustExist("Display/_impl/option.luau");
mustExist("Module3D/_impl/init.luau");
mustExist("FormatNumber/_impl/Main/init.lua");
mustExist("SOURCES.md");
mustContain("SOURCES.md", "https://github.com/howmanysmall/Janitor");
mustContain("SOURCES.md", "https://github.com/dphfox/Fusion");
mustContain("SOURCES.md", "https://github.com/KartzRbx/dataservicev2");

if (exists("DataService/Packages/janitor/init.luau")) {
	missing.push("DataService/Packages/janitor must be removed; use sibling CluauppLibs.Janitor");
}

if (exists("Janitor/_impl/Promise.luau") || exists("Janitor/Promise.luau")) {
	missing.push("nested Promise inside Janitor must not exist");
}

if (exists("_wally.luau")) {
	missing.push("stale _wally.luau still in runtime/");
}

for (const name of ["Fusion.luau", "Iris.luau", "Cmdr.luau", "DataService.luau", "Janitor.luau", "Net.luau", "MathUtils.luau"]) {
	if (exists(name)) {
		missing.push(`stale stub ${name} should be a folder, not a file`);
	}
}

const headerDir = includeLibs;
for (const file of fs.readdirSync(headerDir)) {
	if (!file.endsWith(".hpp")) {
		continue;
	}
	const text = fs.readFileSync(path.join(headerDir, file), "utf8");
	if (text.includes("LuauValue")) {
		missing.push(`include/cluaupp/libs/${file} still uses LuauValue on the public border`);
	}
}

const fixture = `#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/promise.hpp>
#include <cluaupp/libs/dataservice.hpp>

void OnCoins(int newValue, int oldValue) {
	return;
}

void init() {
	Janitor* janitor = new Janitor();
	janitor->Add(janitor);
	auto* coins = Net::Event("Coins");
	coins->FireAll(25);
	Promise::delay(1);
	Data* data = DataService::Server.WaitFor(nullptr);
	data->GetChangedSignal(DataService::Server.Paths).Connect(OnCoins);
}
`;

const luau = compileSource(fixture, "typed-runtime.cpp", { strict: true });
const emitChecks = [
	'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
	"require(ReplicatedStorage.CluauppLibs.Janitor)",
	"type Janitor = Janitor.Janitor",
	"require(ReplicatedStorage.CluauppLibs.Net)",
	"require(ReplicatedStorage.CluauppLibs.Promise)",
	"require(ReplicatedStorage.CluauppLibs.DataService)",
	"type Data = DataService.Data",
	"Janitor.new()",
	'Net.Event("Coins")',
	"DataService.Server:WaitFor",
	"data:GetChangedSignal",
];
for (const piece of emitChecks) {
	if (!luau.includes(piece)) {
		missing.push(`emit missing ${JSON.stringify(piece)}`);
	}
}
if (luau.includes('WaitForChild("CluauppLibs")')) {
	missing.push("generated Luau still uses WaitForChild(\"CluauppLibs\")");
}

const luauBin = spawnSync("luau", ["--version"], { encoding: "utf8" });
if (luauBin.status === 0) {
	const analyze = spawnSync("luau-analyze", ["--", path.join(runtime, "Janitor", "init.luau")], {
		encoding: "utf8",
	});
	if (analyze.status !== 0 && analyze.error && analyze.error.code === "ENOENT") {
		// luau exists but luau-analyze does not
	} else if (analyze.status !== 0 && !analyze.error) {
		missing.push("luau-analyze Janitor/init.luau failed");
	}
}

if (missing.length > 0) {
	console.error("Cluaupp runtime libs test failed:");
	for (const item of missing) {
		console.error(" -", item);
	}
	if (!luau.includes("require(ReplicatedStorage.CluauppLibs.Janitor)")) {
		console.error("\nEmit:\n" + luau);
	}
	process.exit(1);
}

console.log("Cluaupp runtime libs ok");
