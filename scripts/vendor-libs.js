"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VENDOR = path.join(VENDOR_ROOT(), "vendor");
const RUNTIME = path.join(ROOT, "runtime");

function VENDOR_ROOT() {
	return ROOT;
}

const SKIP_NAMES = new Set([
	".git",
	".github",
	".vscode",
	"__tests__",
	"jest.config.luau",
	"node_modules",
]);

function shouldSkipFile(name) {
	return name.endsWith(".spec.lua") || name.endsWith(".spec.luau") || name === "demoWindow.lua";
}

function copyTree(from, to, options = {}) {
	const extraSkip = new Set(options.skip || []);
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		if (SKIP_NAMES.has(entry.name) || extraSkip.has(entry.name)) {
			continue;
		}
		if (shouldSkipFile(entry.name)) {
			continue;
		}
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyTree(src, dest, options);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

function copyLicense(fromDir, toDir) {
	for (const name of ["LICENSE", "LICENSE.md", "LICENSE.txt", "license"]) {
		const src = path.join(fromDir, name);
		if (fs.existsSync(src)) {
			fs.copyFileSync(src, path.join(toDir, name === "license" ? "LICENSE" : name));
			return;
		}
	}
}

function write(file, contents) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, contents.replace(/\r\n/g, "\n"), "utf8");
}

function read(file) {
	return fs.readFileSync(file, "utf8");
}

function rmIfFile(file) {
	if (fs.existsSync(file) && fs.statSync(file).isFile()) {
		fs.unlinkSync(file);
	}
}

function rmDir(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

function vendorImpl({ destName, sourceDir, repoDir, skip }) {
	const dest = path.join(RUNTIME, destName, "_impl");
	rmDir(dest);
	copyTree(sourceDir, dest, { skip });
	if (repoDir) {
		copyLicense(repoDir, dest);
	}
	return dest;
}

function patchFile(file, transform) {
	if (!fs.existsSync(file)) {
		throw new Error(`missing ${file}`);
	}
	const next = transform(read(file));
	write(file, next);
}

function clearStaleRuntimeStubs() {
	for (const name of ["Fusion.luau", "Iris.luau", "Cmdr.luau", "DataService.luau", "Janitor.luau", "_wally.luau"]) {
		rmIfFile(path.join(RUNTIME, name));
	}
}

clearStaleRuntimeStubs();

// Promise stays evaera this pass. Every other Wally dump is a PascalCase native
// (Sweep, Spark, Keep, Mint, Gleam, Bloom, Lens, Crest, Pin, Stage, Coil, Helm,
// Shift, Hive, Ember, Echo, Guide, Trace, Axiom, Roster, Flare). Do not copy
// those GitHub repos over runtime/.

if (fs.existsSync(path.join(VENDOR, "Promise", "lib"))) {
	vendorImpl({
		destName: "Promise",
		sourceDir: path.join(VENDOR, "Promise", "lib"),
		repoDir: path.join(VENDOR, "Promise"),
		skip: ["init.spec.lua"],
	});
	patchFile(path.join(RUNTIME, "Promise", "_impl", "init.lua"), (text) => {
		if (text.includes("Promise.prototype.Then = Promise.prototype.andThen")) {
			return text;
		}
		return text.replace(
			/\nreturn Promise\s*$/,
			`

-- Cluaupp C++ surface: Then / Catch / Await / Cancel
Promise.prototype.Then = Promise.prototype.andThen
Promise.prototype.Catch = Promise.prototype.catch
Promise.prototype.Finally = Promise.prototype.finally
Promise.prototype.Await = Promise.prototype.await
Promise.prototype.Cancel = Promise.prototype.cancel
Promise.prototype.GetStatus = Promise.prototype.getStatus

return Promise
`,
		);
	});
}

require("./sync-packages.js");

console.log("vendored Promise; native CluauppLibs left in place");
for (const entry of fs.readdirSync(RUNTIME).sort()) {
	const full = path.join(RUNTIME, entry);
	const kind = fs.statSync(full).isDirectory() ? "dir" : "file";
	console.log(`  ${kind} ${entry}`);
}
