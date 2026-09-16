"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("../src/cli");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-hold-"));

function fail(message) {
	console.error("Cluaupp hold-on-error test failed:", message);
	process.exit(1);
}

fs.mkdirSync(path.join(dir, "src", "shared"), { recursive: true });
fs.writeFileSync(
	path.join(dir, "cluaupp.config.json"),
	JSON.stringify({ rootDir: "src", outDir: "out", architecture: false, strict: true }),
	"utf8",
);
fs.writeFileSync(path.join(dir, "src", "shared", "Keep.cpp"), "const int KEEP = 1;\n", "utf8");

build(dir, { exitOnError: true, syncVendor: false, holdOnError: false });

const keepOut = path.join(dir, "out", "shared", "Keep.luau");
if (!fs.existsSync(keepOut)) {
	fail("initial emit missing Keep.luau");
}
const good = fs.readFileSync(keepOut, "utf8");
if (!good.includes("KEEP")) {
	fail("initial Keep.luau did not contain KEEP");
}

fs.writeFileSync(path.join(dir, "src", "shared", "Keep.cpp"), "this is not valid C++ {\n", "utf8");
const broken = build(dir, { exitOnError: false, syncVendor: false, holdOnError: true });
if (broken.failed < 1) {
	fail("broken source should report a compile error");
}

const held = fs.readFileSync(keepOut, "utf8");
if (held !== good) {
	fail("watch holdOnError overwrote out/ with a broken compile");
}

console.log("Cluaupp hold-on-error ok");
