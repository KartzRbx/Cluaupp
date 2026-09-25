"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("../generated/cli");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(ROOT, "templates", "game");

function fail(message, extra) {
	console.error(message);
	if (extra) {
		console.error(extra);
	}
	process.exit(1);
}

function expect(cond, message, extra) {
	if (!cond) {
		fail(message, extra);
	}
}

function contains(body, pieces, label) {
	const text = String(body || "");
	const missing = pieces.filter((piece) => !text.includes(piece));
	expect(missing.length === 0, `${label} missing ${JSON.stringify(missing)}`, text);
}

function refuses(body, pieces, label) {
	const text = String(body || "");
	const leaked = pieces.filter((piece) => text.includes(piece));
	expect(leaked.length === 0, `${label} must not contain ${JSON.stringify(leaked)}`, text);
}

function posix(file) {
	return String(file).replace(/\\/g, "/");
}

function walkFiles(dir, files = []) {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(full, files);
		} else {
			files.push(full);
		}
	}
	return files;
}

function listOut(root) {
	const outDir = path.join(root, "out");
	return walkFiles(outDir)
		.map((file) => posix(path.relative(outDir, file)))
		.sort();
}

function readOut(root, rel) {
	const file = path.join(root, "out", rel);
	expect(fs.existsSync(file), `missing out/${rel}`, listOut(root).join("\n"));
	return fs.readFileSync(file, "utf8");
}

function writeFile(root, rel, contents) {
	const dest = path.join(root, rel);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.writeFileSync(dest, contents, "utf8");
}

function makeGame(files = {}, config = {}) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-"));
	writeFile(
		dir,
		"cluaupp.config.json",
		JSON.stringify({ rootDir: "Src", outDir: "out", strict: true, architecture: false, ...config }, null, "\t"),
	);
	fs.copyFileSync(path.join(TEMPLATE, "default.project.json"), path.join(dir, "default.project.json"));
	for (const [rel, contents] of Object.entries(files)) {
		writeFile(dir, rel, contents);
	}
	return dir;
}

function copyTemplateGame(config = {}) {
	const dir = makeGame({}, config);
	const srcFrom = path.join(TEMPLATE, "Src");
	const srcTo = path.join(dir, "Src");
	fs.cpSync(srcFrom, srcTo, { recursive: true });
	return dir;
}

function buildGame(root, options = {}) {
	return build(root, {
		exitOnError: false,
		syncVendor: false,
		holdOnError: false,
		...options,
	});
}

function skipWithoutClpp() {
	try {
		require("../generated/clpp/runner").resolveClppBinary();
	} catch (err) {
		console.log("skip:", err instanceof Error ? err.message : err);
		process.exit(0);
	}
}

module.exports = {
	ROOT,
	TEMPLATE,
	fail,
	expect,
	contains,
	refuses,
	posix,
	listOut,
	readOut,
	writeFile,
	makeGame,
	copyTemplateGame,
	buildGame,
	skipWithoutClpp,
};
