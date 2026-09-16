"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const cluaupp = path.join(__dirname, "..", "bin", "cluaupp.js");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-prune-"));

function fail(message) {
	console.error("Cluaupp prune test failed:", message);
	process.exit(1);
}

fs.mkdirSync(path.join(dir, "src", "shared"), { recursive: true });
fs.writeFileSync(
	path.join(dir, "cluaupp.config.json"),
	JSON.stringify({ rootDir: "src", outDir: "out", architecture: false, strict: true }),
	"utf8",
);
fs.writeFileSync(path.join(dir, "src", "shared", "Keep.cpp"), "const int KEEP = 1;\n", "utf8");
fs.writeFileSync(path.join(dir, "src", "shared", "Gone.cpp"), "const int GONE = 2;\n", "utf8");

const first = spawnSync(process.execPath, [cluaupp, "build", dir], { encoding: "utf8" });
if (first.status !== 0) {
	console.error(first.stdout);
	console.error(first.stderr);
	fail("first build exited " + first.status);
}

const keepOut = path.join(dir, "out", "shared", "Keep.luau");
const goneOut = path.join(dir, "out", "shared", "Gone.luau");
if (!fs.existsSync(keepOut) || !fs.existsSync(goneOut)) {
	fail("first build did not emit Keep.luau and Gone.luau");
}

fs.unlinkSync(path.join(dir, "src", "shared", "Gone.cpp"));

const second = spawnSync(process.execPath, [cluaupp, "build", dir], { encoding: "utf8" });
if (second.status !== 0) {
	console.error(second.stdout);
	console.error(second.stderr);
	fail("second build exited " + second.status);
}

if (!fs.existsSync(keepOut)) {
	fail("Keep.luau was removed; Rojo would lose a live script");
}
if (fs.existsSync(goneOut)) {
	fail("Gone.luau was not pruned after its source was deleted");
}
if (!fs.existsSync(path.join(dir, "out"))) {
	fail("out/ root was deleted; that can stall Rojo");
}

console.log("Cluaupp prune ok");
