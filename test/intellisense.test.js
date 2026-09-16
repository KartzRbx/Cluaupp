"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const flattened = fs.existsSync(path.join(ROOT, ".vscode", "c_cpp_properties.json"));
const WORKSPACE = flattened ? ROOT : path.join(ROOT, "..");
const INCLUDE = path.join(ROOT, "include");
const ROBLOX = path.join(INCLUDE, "cluaupp", "roblox.hpp");
const DATATYPES = path.join(INCLUDE, "cluaupp", "datatypes.hpp");
const INSTANCES = path.join(INCLUDE, "cluaupp", "generated", "instances.hpp");
const DATASERVICE = path.join(INCLUDE, "cluaupp", "libs", "dataservice.hpp");

function fail(message) {
	console.error("Cluaupp IntelliSense test failed:", message);
	process.exit(1);
}

function read(file) {
	if (!fs.existsSync(file)) {
		fail("missing " + file);
	}
	return fs.readFileSync(file, "utf8");
}

const roblox = read(ROBLOX);
const datatypes = read(DATATYPES);
const instances = read(INSTANCES);
const dataService = read(DATASERVICE);

if (!roblox.includes("#include <cluaupp/datatypes.hpp>")) {
	fail("roblox.hpp must include datatypes.hpp");
}
if (roblox.includes("#define nullptr")) {
	fail("roblox.hpp must not redefine nullptr");
}
if (!datatypes.includes("struct LuauValue")) {
	fail("datatypes.hpp needs LuauValue for library headers");
}
if (!datatypes.includes("struct LuaArray")) {
	fail("datatypes.hpp needs LuaArray for GetPlayers / GetChildren");
}
if (/Vector3 Unit;/.test(datatypes)) {
	fail("Vector3.Unit cannot be a by-value member (infinite size)");
}
if (/Vector2 Unit;/.test(datatypes)) {
	fail("Vector2.Unit cannot be a by-value member (infinite size)");
}
if (/CFrame Rotation;/.test(datatypes)) {
	fail("CFrame.Rotation cannot be a by-value member (infinite size)");
}
if (/Ray Unit;/.test(datatypes)) {
	fail("Ray.Unit cannot be a by-value member (infinite size)");
}
if (!datatypes.includes("Vector3 Unit()")) {
	fail("Vector3.Unit should be a method for IntelliSense");
}
if (!datatypes.includes("template <typename F>")) {
	fail("RBXScriptSignal.Connect must be a template");
}
if (!instances.includes("FindFirstChild(string name, bool recursive = false)")) {
	fail("FindFirstChild must default recursive so one-arg calls type-check");
}
if (!instances.includes("LuaArray<::Player*> GetPlayers()")) {
	fail("GetPlayers must return LuaArray<::Player*> so range-for type-checks");
}
if (instances.includes("Instance** GetPlayers()")) {
	fail("GetPlayers must not return Instance**");
}
if (/auto Paths;/.test(dataService)) {
	fail("DataService.Paths cannot be an untyped auto member");
}
if (!/template <typename T>[\s\S]*T Template;/.test(dataService)) {
	fail("DataServiceOptions must be generic over Template");
}

const vscode = JSON.parse(read(path.join(WORKSPACE, ".vscode", "c_cpp_properties.json")));
const includePath = vscode.configurations[0].includePath.join("\n");
if (flattened) {
	if (!includePath.includes("${workspaceFolder}/include") || !includePath.includes("game/include")) {
		fail("workspace c_cpp_properties.json must include include/ and game/include");
	}
} else if (!includePath.includes("cluau/include") || !includePath.includes("game/include")) {
	fail("workspace c_cpp_properties.json must include cluau/include and game/include");
}

const settings = JSON.parse(read(path.join(WORKSPACE, ".vscode", "settings.json")));
const defaultIncludes = (settings["C_Cpp.default.includePath"] || []).join("\n");
if (flattened) {
	if (!defaultIncludes.includes("${workspaceFolder}/include")) {
		fail("C_Cpp.default.includePath must include ${workspaceFolder}/include");
	}
} else if (!defaultIncludes.includes("cluau/include")) {
	fail("C_Cpp.default.includePath must include cluau/include");
}

const compileFlags = read(path.join(WORKSPACE, "compile_flags.txt"));
if (flattened) {
	if (!compileFlags.includes("-Iinclude")) {
		fail("compile_flags.txt must pass -Iinclude for clangd");
	}
} else if (!compileFlags.includes("-Icluau/include")) {
	fail("compile_flags.txt must pass -Icluau/include for clangd");
}

const templateFlags = read(path.join(ROOT, "templates", "game", "compile_flags.txt"));
if (!templateFlags.includes("-Iinclude")) {
	fail("game template compile_flags.txt must include -Iinclude");
}

const probe = `#include <cluaupp/roblox.hpp>

struct PlayerSave {
	int Coins = 0;
};

void CreateLeaderstats(Player* player) {
	if (player->FindFirstChild("leaderstats") != nullptr) {
		return;
	}
	auto* leaderstats = new Folder(player);
	leaderstats->Name = "leaderstats";
	auto* coins = new IntValue(leaderstats);
	coins->Name = "Coins";
	coins->Value = 0;
}

void init() {
	auto* players = GetService<Players>();
	for (auto* player : players->GetPlayers()) {
		CreateLeaderstats(player);
	}
	players->PlayerAdded.Connect(CreateLeaderstats);
	Vector3 size(8, 1, 8);
	auto mag = size.Magnitude;
	auto unit = size.Unit();
	auto* janitor = new Janitor();
	janitor->Add(players);
	PlayerSave save {};
	DataService::Server.Init(DataServiceOptions {
		.Template = save,
		.StoreName = "PlayerData",
		.UseMock = true,
	});
	print("ok");
}
`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-is-"));
const probeFile = path.join(dir, "probe.cpp");
fs.writeFileSync(probeFile, probe, "utf8");

const compilers = [
	"C:/msys64/ucrt64/bin/g++.exe",
	"g++",
	"clang++",
];

let compiler = null;
for (const candidate of compilers) {
	const probeCompiler = spawnSync(candidate, ["--version"], { encoding: "utf8" });
	if (probeCompiler.status === 0) {
		compiler = candidate;
		break;
	}
}

if (compiler) {
	const result = spawnSync(
		compiler,
		["-std=c++20", "-fsyntax-only", "-I", INCLUDE, probeFile],
		{ encoding: "utf8" },
	);
	if (result.status !== 0) {
		console.error(result.stdout);
		console.error(result.stderr);
		fail(compiler + " -fsyntax-only rejected the IntelliSense headers");
	}
	console.log("Cluaupp IntelliSense ok (" + compiler + " -fsyntax-only)");
} else {
	console.log("Cluaupp IntelliSense ok (headers + editor paths; no g++/clang++ on PATH)");
}
