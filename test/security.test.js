"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { loadConfig } = require("../generated/utils/project");
const { safeRelPath, isInside, assertInitDest } = require("../generated/utils/safe-paths");
const { expect, fail, writeFile } = require("./helpers");

expect(safeRelPath("../../etc/passwd") === null, "safeRelPath must reject ..");
expect(safeRelPath("/tmp/out.luau") === null, "safeRelPath must reject absolute unix paths");
expect(safeRelPath("C:/Windows/out.luau") === null, "safeRelPath must reject drive paths");
expect(safeRelPath("server/leaderstats.server.luau") === "server/leaderstats.server.luau", "safeRelPath keeps tagged out names");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-sec-"));
expect(isInside(root, path.join(root, "out", "a.luau")), "out file is inside root");
expect(!isInside(root, path.join(root, "..", "outside.luau")), "parent file is outside root");

try {
	assertInitDest(path.parse(process.cwd()).root);
	fail("init at filesystem root must throw");
} catch (err) {
	expect(/filesystem root/.test(err.message), `unexpected init root error: ${err.message}`);
}

writeFile(root, "src/shared/Keep.cpp", "const int KEEP = 1;\n");
writeFile(root, "cluaupp.config.json", JSON.stringify({ rootDir: "src", outDir: "../stolen", strict: true }));
try {
	loadConfig(root);
	fail("outDir ../stolen must be rejected");
} catch (err) {
	expect(/invalid outDir|escapes/.test(err.message), `unexpected outDir error: ${err.message}`);
}

writeFile(root, "cluaupp.config.json", JSON.stringify({ rootDir: "src", outDir: "src", strict: true }));
try {
	loadConfig(root);
	fail("outDir equal to rootDir must be rejected");
} catch (err) {
	expect(/must be different|invalid/.test(err.message), `unexpected same-dir error: ${err.message}`);
}

writeFile(root, "cluaupp.config.json", '{"rootDir":"src","outDir":"out","strict":true,"__proto__":{"outDir":".."}}\n');
const config = loadConfig(root);
expect(config.outDir === "out", `config allowlist leaked ${config.outDir}`);

const pack = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["pack", "--dry-run"], {
	cwd: path.join(__dirname, ".."),
	encoding: "utf8",
	windowsHide: true,
});
const listing = `${pack.stdout || ""}\n${pack.stderr || ""}`;
expect(!listing.includes(".env.local") && !/\.env"/.test(listing), "npm pack must not include .env secrets", listing);

console.log("Cluaupp security ok");
