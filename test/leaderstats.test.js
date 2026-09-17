"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("../src/compile");

const source = fs.readFileSync(
	path.join(__dirname, "..", "templates", "game", "src", "server", "leaderstats.server.cpp"),
	"utf8",
);

const one = compileService(source, "server/leaderstats.server.cpp", {
	relativeName: "server/leaderstats.server.cpp",
});

if (one.kind !== "flat") {
	console.error("expected 1:1 flat emit, got", one.kind);
	process.exit(1);
}

const oneName = one.files[0].name.replace(/\\/g, "/");
if (oneName !== "server/leaderstats.server.luau") {
	console.error("expected server/leaderstats.server.luau, got", oneName);
	process.exit(1);
}

const oneLuau = one.files[0].contents;
for (const piece of ["--!strict", "CreateLeaderstats", "GetPlayers", "PlayerAdded", "init()"]) {
	if (!oneLuau.includes(piece)) {
		console.error("1:1 leaderstats missing", piece);
		console.error(oneLuau);
		process.exit(1);
	}
}
if (oneLuau.includes("require(script.Main)") || oneLuau.includes("LeaderStatsTypes") || oneLuau.includes("DataController")) {
	console.error("1:1 leaderstats must not invent Main/Types/Controller");
	console.error(oneLuau);
	process.exit(1);
}

const result = compileService(source, "server/leaderstats.server.cpp", {
	strict: true,
	relativeName: "server/leaderstats.server.cpp",
	architecture: true,
});

if (result.kind !== "service") {
	console.error("expected service architecture, got", result.kind);
	process.exit(1);
}

const files = Object.fromEntries(result.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const requiredNames = [
	"server/LeaderStats/init.server.luau",
	"server/LeaderStats/init.meta.json",
	"server/LeaderStats/Main.luau",
	"server/LeaderStats/PlayersManager.luau",
	"server/LeaderStats/CacheController.luau",
	"server/LeaderStats/LeaderStatsTypes.luau",
];

for (const name of requiredNames) {
	if (!files[name]) {
		console.error("missing artifact", name);
		console.error("got", Object.keys(files));
		process.exit(1);
	}
}

const types = files["server/LeaderStats/LeaderStatsTypes.luau"];
const cache = files["server/LeaderStats/CacheController.luau"];
const players = files["server/LeaderStats/PlayersManager.luau"];
const main = files["server/LeaderStats/Main.luau"];
const boot = files["server/LeaderStats/init.server.luau"];

const checks = {
	"server/LeaderStats/LeaderStatsTypes.luau": [
		"--!strict",
		"export type StatName = \"Coins\" | \"Level\"",
		"export type LeaderStatsData = {",
		"Coins: number",
		"Level: number",
		"export type PlayerCache = {",
		"Folder: Folder",
		"Coins: IntValue",
		"return {}",
		"Occlude.Keys",
		"ArrayIndexer.Table",
	],
	"server/LeaderStats/CacheController.luau": [
		"--!strict",
		"player:FindFirstChild(FOLDER_NAME)",
		'const FOLDER_NAME = "leaderstats"',
		'Instance.new("Folder")',
		'Instance.new("IntValue")',
		"function CacheController.Get(",
		"function CacheController.Ensure(",
		"function CacheController.Clear(",
		"function CacheController.ClearAll(",
		"return CacheController",
	],
	"server/LeaderStats/PlayersManager.luau": [
		"--!strict",
		"Players:GetPlayers()",
		"Players.PlayerAdded:Connect",
		"Players.PlayerRemoving:Connect",
		"Janitor.new()",
		"function PlayersManager.Start(",
		"function PlayersManager.Stop(",
		"return PlayersManager",
	],
	"server/LeaderStats/Main.luau": [
		"--!strict",
		"require(script.Parent.PlayersManager)",
		"require(script.Parent.CacheController)",
		"CacheController.Ensure(player)",
		"function Main.Start()",
		"function Main.Stop()",
		"CacheController.ClearAll()",
		"return Main",
	],
	"server/LeaderStats/init.server.luau": ["--!strict", "require(script.Main):Start()"],
	"server/LeaderStats/init.meta.json": ["Enum.RunContext.Server"],
};

let failed = false;
for (const [name, pieces] of Object.entries(checks)) {
	const body = files[name];
	const missing = pieces.filter((piece) => !body.includes(piece));
	if (missing.length > 0) {
		failed = true;
		console.error(name, "missing:");
		for (const piece of missing) {
			console.error(" -", piece);
		}
	}
	if (name.includes("Types") && /\bany\b/.test(body.replace(/Occlude\.Keys[^\n]*/g, ""))) {
		failed = true;
		console.error(name, "must not use generic any for data");
	}
}

if (failed) {
	console.error("\n--- Types ---\n" + types);
	console.error("\n--- Cache ---\n" + cache);
	console.error("\n--- Players ---\n" + players);
	console.error("\n--- Main ---\n" + main);
	console.error("\n--- Boot ---\n" + boot);
	process.exit(1);
}

console.log("Cluaupp leaderstats service ok");
console.log(oneName);
console.log(Object.keys(files).join("\n"));
console.log(main);
