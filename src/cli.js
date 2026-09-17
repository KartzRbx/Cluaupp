"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("./compile");
const { isSourceFile, toLuauPath } = require("./preprocess");
const { syncEditorSupport, installEditorSupport } = require("./intellisense");
const pkg = require("../package.json");

function printHelp() {
	console.log(`Cluaupp ${pkg.version} — C++ × Luau

Usage:
  cluaupp init [folder]    create a game (src/server, src/client, src/shared)
  cluaupp build [folder]   transpile src → out (one file per .cpp)
  cluaupp watch [folder]   rebuild on save
  cluaupp lsp [folder]     language server (stdio JSON-RPC)
  cluaupp intellisense     install Cursor/VS Code IntelliSense
  cluaupp --version        print version
  cluaupp --help           this help

Flow: cluaupp init → cluaupp build → rojo serve (plugin in Roblox Studio)
Docs: https://github.com/kartzDev/cluaupp
`);
}

function copyDir(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyDir(src, dest);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

function tryRm(target) {
	try {
		fs.rmSync(target, { recursive: true, force: true });
		return true;
	} catch (err) {
		if (err.code === "EPERM" || err.code === "EBUSY" || err.code === "ENOTEMPTY") {
			console.error("cluaupp: skip remove", target, `(${err.code})`);
			return false;
		}
		throw err;
	}
}

function copyFileIfChanged(src, dest, mode = "fill") {
	if (mode === "fill" && fs.existsSync(dest)) {
		return;
	}
	if (mode === "update" && fs.existsSync(dest)) {
		const from = fs.statSync(src);
		const to = fs.statSync(dest);
		if (from.size === to.size && from.mtimeMs <= to.mtimeMs) {
			return;
		}
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	try {
		fs.copyFileSync(src, dest);
	} catch (err) {
		if (err.code === "EPERM" || err.code === "EBUSY") {
			console.error("cluaupp: skip copy", dest, `(${err.code})`);
			return;
		}
		throw err;
	}
}

function syncDir(from, to, mode = "fill") {
	if (!fs.existsSync(from)) {
		return;
	}
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			syncDir(src, dest, mode);
		} else {
			copyFileIfChanged(src, dest, mode);
		}
	}
}

function copyRuntime(dest) {
	const runtime = path.join(__dirname, "..", "runtime");
	if (!fs.existsSync(runtime)) {
		return;
	}
	syncDir(runtime, path.join(dest, "libs"));
}

function copyHeaders(dest) {
	const from = path.join(__dirname, "..", "include", "cluaupp");
	if (!fs.existsSync(from)) {
		return;
	}
	syncDir(from, path.join(dest, "include", "cluaupp"));
}

function loadConfig(root) {
	const configNames = ["cluaupp.config.json", "cluau.config.json"];
	for (const name of configNames) {
		const file = path.join(root, name);
		if (fs.existsSync(file)) {
			return { rootDir: "src", outDir: "out", strict: false, architecture: false, ...JSON.parse(fs.readFileSync(file, "utf8")) };
		}
	}
	return { rootDir: "src", outDir: "out", strict: false, architecture: false };
}

function collectCpp(dir, files = []) {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectCpp(full, files);
		} else if (isSourceFile(entry.name)) {
			files.push(full);
		}
	}
	return files;
}

function collectFiles(dir, files = []) {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectFiles(full, files);
		} else {
			files.push(full);
		}
	}
	return files;
}

function resolveKey(file) {
	const resolved = path.resolve(file);
	return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function posixRel(from, file) {
	return path.relative(from, file).replace(/\\/g, "/");
}

function sourcePrefixes(rel) {
	const noExt = rel.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, "");
	const noTag = noExt.replace(/\.(server|client)$/i, "");
	return [...new Set([noExt, noTag, toLuauPath(rel).replace(/\\/g, "/")])];
}

function matchesPrefix(relOut, prefixes) {
	const n = relOut.replace(/\\/g, "/").toLowerCase();
	return prefixes.some((prefix) => {
		const k = prefix.replace(/\\/g, "/").toLowerCase();
		return n === k || n === `${k}.luau` || n.startsWith(`${k}/`) || n.startsWith(`${k}.`);
	});
}

function removeEmptyOutDirs(outDir, projectRoot) {
	if (!fs.existsSync(outDir)) {
		return;
	}
	const walk = (dir) => {
		if (resolveKey(dir) === resolveKey(outDir)) {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					walk(path.join(dir, entry.name));
				}
			}
			return;
		}
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				walk(path.join(dir, entry.name));
			}
		}
		if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
			if (tryRm(dir)) {
				console.log("cluaupp: removed", path.relative(projectRoot, dir));
			}
		}
	};
	walk(outDir);
}

function pruneOut(root, config, written, failedPrefixes) {
	const outDir = path.join(root, config.outDir);
	if (!fs.existsSync(outDir)) {
		return;
	}
	for (const file of collectFiles(outDir)) {
		if (written.has(resolveKey(file))) {
			continue;
		}
		const rel = posixRel(outDir, file);
		if (matchesPrefix(rel, failedPrefixes)) {
			continue;
		}
		if (tryRm(file)) {
			console.log("cluaupp: removed", path.relative(root, file));
		}
	}
	removeEmptyOutDirs(outDir, root);
}

function compileProject(root, config) {
	const srcDir = path.join(root, config.rootDir);
	const files = collectCpp(srcDir);
	const jobs = [];
	const errors = [];

	for (const file of files) {
		const source = fs.readFileSync(file, "utf8");
		const rel = posixRel(srcDir, file);
		try {
			const result = compileService(source, rel, {
				...config,
				filePath: file,
				relativeName: rel,
				outName: toLuauPath(rel),
				architecture: config.architecture === true,
				includeDirs: [path.dirname(file), srcDir, path.join(root, "include")],
				srcDir,
			});
			jobs.push({ rel, files: result.files, stale: result.stale || [] });
		} catch (err) {
			errors.push({ rel, prefixes: sourcePrefixes(rel), message: err.message });
		}
	}

	return { files, jobs, errors };
}

function writeTextIfChanged(dest, contents) {
	if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === contents) {
		return false;
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.writeFileSync(dest, contents, "utf8");
	return true;
}

function writeJobs(root, config, jobs) {
	const written = new Set();
	for (const job of jobs) {
		for (const artifact of job.files) {
			const dest = path.join(root, config.outDir, artifact.name);
			const changed = writeTextIfChanged(dest, artifact.contents);
			written.add(resolveKey(dest));
			if (changed) {
				console.log("cluaupp:", job.rel, "→", path.relative(root, dest));
			}
		}
		for (const stale of job.stale) {
			const dest = path.join(root, config.outDir, stale);
			if (fs.existsSync(dest) && !written.has(resolveKey(dest))) {
				if (tryRm(dest)) {
					console.log("cluaupp: removed", path.relative(root, dest));
				}
			}
		}
	}
	return written;
}

function libsPresent(root) {
	const libs = path.join(root, "libs");
	return fs.existsSync(libs) && fs.readdirSync(libs).length > 0;
}

function ensureVendor(root) {
	copyRuntime(root);
	copyHeaders(root);
}

function build(root, options = {}) {
	const exitOnError = options.exitOnError !== false;
	const holdOnError = options.holdOnError === true;
	const config = loadConfig(root);
	if (options.syncVendor !== false) {
		ensureVendor(root);
	}
	const srcDir = path.join(root, config.rootDir);
	if (!fs.existsSync(srcDir) || collectCpp(srcDir).length === 0) {
		console.error("no .cpp/.h/.hpp files in", config.rootDir);
		if (!holdOnError) {
			pruneOut(root, config, new Set(), []);
		}
		if (exitOnError) {
			process.exit(1);
		}
		return { failed: 0, written: new Set() };
	}

	const compiled = compileProject(root, config);
	if (compiled.errors.length > 0) {
		for (const err of compiled.errors) {
			console.error(err.message);
		}
		if (holdOnError) {
			console.error(`cluaupp: out not updated (${compiled.errors.length} compile error${compiled.errors.length === 1 ? "" : "s"})`);
			try {
				syncEditorSupport(root, config);
			} catch (err) {
				console.error("cluaupp: intellisense sync failed", err.message);
			}
			return { failed: compiled.errors.length, written: new Set() };
		}
	}

	const written = writeJobs(root, config, compiled.jobs);
	const failedPrefixes = compiled.errors.flatMap((err) => err.prefixes);
	pruneOut(root, config, written, failedPrefixes);
	try {
		syncEditorSupport(root, config);
	} catch (err) {
		console.error("cluaupp: intellisense sync failed", err.message);
	}
	if (compiled.errors.length > 0 && exitOnError) {
		process.exit(1);
	}
	return { failed: compiled.errors.length, written };
}

async function init(dest) {
	const template = path.join(__dirname, "..", "templates", "game");
	const include = path.join(__dirname, "..", "include");
	copyDir(template, dest);
	copyDir(include, path.join(dest, "include"));
	copyRuntime(dest);
	syncEditorSupport(dest);
	const installed = await installEditorSupport();
	console.log("Cluaupp ready in", dest);
	console.log("  cluaupp build");
	console.log("  rojo serve");
	if (installed.local.length || (installed.cpp && installed.cpp.status === "installed")) {
		console.log("  reload Cursor (Ctrl+Shift+P → Developer: Reload Window)");
	}
}

function pidAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function acquireWatchLock(root) {
	const file = path.join(root, ".cluaupp-watch.lock");
	if (fs.existsSync(file)) {
		const pid = Number(fs.readFileSync(file, "utf8").trim());
		if (Number.isFinite(pid) && pid !== process.pid && pidAlive(pid)) {
			console.error(`cluaupp: watch already running (pid ${pid}). Stop it first — two watchers make Rojo crash on libs/.`);
			process.exit(1);
		}
	}
	fs.writeFileSync(file, String(process.pid), "utf8");
	const release = () => {
		try {
			if (fs.existsSync(file) && fs.readFileSync(file, "utf8").trim() === String(process.pid)) {
				fs.unlinkSync(file);
			}
		} catch {
			// ignore
		}
	};
	process.on("exit", release);
	process.on("SIGINT", () => {
		release();
		process.exit(0);
	});
	process.on("SIGTERM", () => {
		release();
		process.exit(0);
	});
}

function watch(root) {
	acquireWatchLock(root);
	build(root, { exitOnError: false, syncVendor: false, holdOnError: true });
	const config = loadConfig(root);
	const dir = path.join(root, config.rootDir);
	let timer = null;
	let running = false;
	let queued = false;

	const run = () => {
		if (running) {
			queued = true;
			return;
		}
		running = true;
		try {
			build(root, { exitOnError: false, syncVendor: false, holdOnError: true });
		} catch (err) {
			console.error(err.message);
		} finally {
			running = false;
			if (queued) {
				queued = false;
				run();
			}
		}
	};

	console.log("cluaupp", pkg.version, "watching", dir, "(libs untouched)");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.watch(dir, { recursive: true }, () => {
		clearTimeout(timer);
		timer = setTimeout(run, 400);
	});
}

function dispatch(args) {
	const cmd = args[0] || "help";
	const cwd = process.cwd();
	if (cmd === "init") {
		return init(path.resolve(cwd, args[1] || ".")).catch((err) => {
			console.error(err.message || err);
			process.exit(1);
		});
	} else if (cmd === "build") {
		build(path.resolve(cwd, args[1] || "."));
	} else if (cmd === "watch") {
		watch(path.resolve(cwd, args[1] || "."));
	} else if (cmd === "lsp") {
		const { start } = require("./lsp");
		start({ projectRoot: path.resolve(cwd, args[1] || ".") });
	} else if (cmd === "intellisense" || cmd === "intelisense") {
		const root = path.resolve(cwd, args[1] || ".");
		syncEditorSupport(root, loadConfig(root));
		return installEditorSupport().then((installed) => {
			console.log("cluaupp: compile_commands.json, .clangd, and .vscode updated in", root);
			if (installed.local.length) {
				for (const dest of installed.local) {
					console.log("cluaupp: Cluaupp IntelliSense", dest);
				}
			}
		}).catch((err) => {
			console.error(err.message || err);
			process.exit(1);
		});
	} else if (cmd === "--version" || cmd === "-v" || cmd === "version") {
		console.log(pkg.version);
	} else {
		printHelp();
	}
}

const launchedAsCli =
	require.main && ["cli.js", "cluaupp.js", "cluau.js"].includes(path.basename(require.main.filename));
if (launchedAsCli) {
	dispatch(process.argv.slice(2));
}

module.exports = { build, watch, dispatch };
