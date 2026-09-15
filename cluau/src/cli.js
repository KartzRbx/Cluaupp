"use strict";

const fs = require("fs");
const path = require("path");
const { compileService } = require("./compile");
const { isSourceFile, isHeaderFile, toLuauPath } = require("./preprocess");
const pkg = require("../package.json");

function printHelp() {
	console.log(`Cluaupp ${pkg.version} — C++ × Luau

Usage:
  cluaupp init [folder]    create a game (src/server, src/client, src/shared)
  cluaupp build [folder]   transpile src → out (PascalCase services)
  cluaupp watch [folder]   rebuild on save
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

function copyRuntime(dest) {
	const runtime = path.join(__dirname, "..", "runtime");
	const libs = path.join(dest, "libs");
	if (fs.existsSync(libs)) {
		fs.rmSync(libs, { recursive: true, force: true });
	}
	if (fs.existsSync(runtime)) {
		copyDir(runtime, libs);
	}
}

function loadConfig(root) {
	const configNames = ["cluaupp.config.json", "cluau.config.json"];
	for (const name of configNames) {
		const file = path.join(root, name);
		if (fs.existsSync(file)) {
			return { rootDir: "src", outDir: "out", strict: true, ...JSON.parse(fs.readFileSync(file, "utf8")) };
		}
	}
	return { rootDir: "src", outDir: "out", strict: true };
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

function siblingCpp(file) {
	return file.replace(/\.(h|hpp|hh)$/i, ".cpp");
}

function build(root, options = {}) {
	const exitOnError = options.exitOnError !== false;
	const config = loadConfig(root);
	copyRuntime(root);
	const files = collectCpp(path.join(root, config.rootDir));
	if (files.length === 0) {
		console.error("no .cpp/.h/.hpp files in", config.rootDir);
		if (exitOnError) {
			process.exit(1);
		}
		return;
	}

	const fileSet = new Set(files.map((file) => path.resolve(file)));
	let failed = 0;
	const written = new Set();
	for (const file of files) {
		if (isHeaderFile(file) && fileSet.has(path.resolve(siblingCpp(file)))) {
			continue;
		}
		const source = fs.readFileSync(file, "utf8");
		const rel = path.relative(path.join(root, config.rootDir), file).replace(/\\/g, "/");
		try {
			const result = compileService(source, rel, {
				...config,
				filePath: file,
				relativeName: rel,
				outName: toLuauPath(rel),
				architecture: config.architecture !== false,
				includeDirs: [path.dirname(file), path.join(root, config.rootDir), path.join(root, "include")],
			});
			for (const artifact of result.files) {
				const dest = path.join(root, config.outDir, artifact.name);
				fs.mkdirSync(path.dirname(dest), { recursive: true });
				fs.writeFileSync(dest, artifact.contents, "utf8");
				written.add(path.resolve(dest));
				console.log("cluaupp:", rel, "→", path.relative(root, dest));
			}
			for (const stale of result.stale || []) {
				const dest = path.join(root, config.outDir, stale);
				if (fs.existsSync(dest) && !written.has(path.resolve(dest))) {
					fs.unlinkSync(dest);
					console.log("cluaupp: removed", path.relative(root, dest));
				}
			}
		} catch (err) {
			failed += 1;
			console.error(err.message);
		}
	}
	if (failed > 0 && exitOnError) {
		process.exit(1);
	}
}

function init(dest) {
	const template = path.join(__dirname, "..", "templates", "game");
	const include = path.join(__dirname, "..", "include");
	copyDir(template, dest);
	copyDir(include, path.join(dest, "include"));
	copyRuntime(dest);
	console.log("Cluaupp ready in", dest);
	console.log("  cluaupp build");
	console.log("  rojo serve");
}

function watch(root) {
	build(root, { exitOnError: false });
	const config = loadConfig(root);
	const dir = path.join(root, config.rootDir);
	console.log("watching", dir);
	fs.watch(dir, { recursive: true }, (_event, filename) => {
		if (filename && isSourceFile(filename)) {
			try {
				build(root, { exitOnError: false });
			} catch (err) {
				console.error(err.message);
			}
		}
	});
}

const args = process.argv.slice(2);
const cmd = args[0] || "help";
const cwd = process.cwd();

if (cmd === "init") {
	init(path.resolve(cwd, args[1] || "."));
} else if (cmd === "build") {
	build(path.resolve(cwd, args[1] || "."));
} else if (cmd === "watch") {
	watch(path.resolve(cwd, args[1] || "."));
} else if (cmd === "--version" || cmd === "-v" || cmd === "version") {
	console.log(pkg.version);
} else {
	printHelp();
}
