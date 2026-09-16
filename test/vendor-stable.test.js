"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("../src/cli");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-vendor-"));

function fail(message) {
	console.error("Cluaupp vendor-stable test failed:", message);
	process.exit(1);
}

fs.mkdirSync(path.join(dir, "src", "shared"), { recursive: true });
fs.mkdirSync(path.join(dir, "libs", "ArrayIndexer"), { recursive: true });
fs.writeFileSync(
	path.join(dir, "cluaupp.config.json"),
	JSON.stringify({ rootDir: "src", outDir: "out", architecture: false, strict: true }),
	"utf8",
);
fs.writeFileSync(path.join(dir, "src", "shared", "Keep.cpp"), "const int KEEP = 1;\n", "utf8");
fs.writeFileSync(path.join(dir, "libs", "ArrayIndexer", "rojo-sentinel.txt"), "keep-me", "utf8");

build(dir, { exitOnError: true, syncVendor: false, holdOnError: false });

const sentinel = path.join(dir, "libs", "ArrayIndexer", "rojo-sentinel.txt");
if (!fs.existsSync(sentinel) || fs.readFileSync(sentinel, "utf8") !== "keep-me") {
	fail("watch-style build must not touch libs/ArrayIndexer");
}

build(dir, { exitOnError: true, holdOnError: false });

if (!fs.existsSync(sentinel) || fs.readFileSync(sentinel, "utf8") !== "keep-me") {
	fail("fill vendor deleted libs/ArrayIndexer sentinel; Rojo would crash");
}
if (!fs.existsSync(path.join(dir, "libs", "ArrayIndexer"))) {
	fail("fill vendor removed libs/ArrayIndexer");
}

console.log("Cluaupp vendor-stable ok");
