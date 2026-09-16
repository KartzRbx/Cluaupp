"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { compileSource } = require("../src/compile");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluau-h-"));
const header = path.join(dir, "stats.h");
const sourceFile = path.join(dir, "game.cpp");

fs.writeFileSync(
	header,
	`#pragma once
#include <cluaupp/roblox.hpp>

const int STARTING_COINS = 25;

void CreateLeaderstats(Player* player);
`,
	"utf8",
);

fs.writeFileSync(
	sourceFile,
	`#include "stats.h"

void CreateLeaderstats(Player* player) {
	auto* coins = new IntValue(player);
	coins->Name = "Coins";
	coins->Value = STARTING_COINS;
}

void init() {
	CreateLeaderstats(nullptr);
}
`,
	"utf8",
);

const headerLuau = compileSource(fs.readFileSync(header, "utf8"), "stats.h", {
	strict: true,
	filePath: header,
	includeDirs: [dir],
});

const cppLuau = compileSource(fs.readFileSync(sourceFile, "utf8"), "game.cpp", {
	strict: true,
	filePath: sourceFile,
	includeDirs: [dir],
});

const headerChecks = ["const STARTING_COINS: number = 25"];
const cppChecks = [
	"const STARTING_COINS = stats.STARTING_COINS",
	'Instance.new("IntValue")',
	"coins.Value = STARTING_COINS",
	"const function CreateLeaderstats(player: Player)",
	"const stats = require(",
];

const missingHeader = headerChecks.filter((piece) => !headerLuau.includes(piece));
const missingCpp = cppChecks.filter((piece) => !cppLuau.includes(piece));
if (headerLuau.includes("local function CreateLeaderstats") || headerLuau.includes("const function CreateLeaderstats")) {
	missingHeader.push("prototype should not emit a function body");
}

if (missingHeader.length || missingCpp.length) {
	console.error("Cluaupp .h test failed");
	if (missingHeader.length) {
		console.error("header missing:", missingHeader);
		console.error(headerLuau);
	}
	if (missingCpp.length) {
		console.error("cpp missing:", missingCpp);
		console.error(cppLuau);
	}
	process.exit(1);
}

console.log("Cluaupp .h ok");
console.log("--- stats.h ---");
console.log(headerLuau);
console.log("--- game.cpp ---");
console.log(cppLuau);
