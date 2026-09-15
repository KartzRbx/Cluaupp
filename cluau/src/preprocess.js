"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_EXTS = [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hh"];

function isSourceFile(fileName) {
	return SOURCE_EXTS.includes(path.extname(fileName).toLowerCase());
}

function isHeaderFile(fileName) {
	return [".h", ".hpp", ".hh"].includes(path.extname(fileName).toLowerCase());
}

function toLuauPath(filePath) {
	return filePath.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
}

function isEngineStub(filePath) {
	const normalized = filePath.replace(/\\/g, "/").toLowerCase();
	return (
		normalized.includes("/include/cluaupp/") ||
		normalized.includes("/include/cluau/") ||
		normalized.endsWith("/roblox.hpp") ||
		normalized.endsWith("/roblox.h")
	);
}

function resolveInclude(name, fromFile, includeDirs) {
	const bases = [path.dirname(fromFile), ...(includeDirs || [])];
	for (const base of bases) {
		const candidate = path.resolve(base, name);
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return null;
}

function preprocess(source, filePath, options = {}) {
	const seen = options.seen || new Set();
	const includeDirs = options.includeDirs || [];
	const resolvedSelf = filePath ? path.resolve(filePath) : null;
	if (resolvedSelf) {
		seen.add(resolvedSelf);
	}

	const lines = String(source).split(/\r?\n/);
	const out = [];

	for (const line of lines) {
		const quoted = line.match(/^\s*#\s*include\s+"([^"]+)"/);
		if (quoted) {
			const resolved = resolveInclude(quoted[1], filePath || process.cwd(), includeDirs);
			if (!resolved || isEngineStub(resolved) || seen.has(resolved)) {
				continue;
			}
			seen.add(resolved);
			const inner = fs.readFileSync(resolved, "utf8");
			out.push(preprocess(inner, resolved, { ...options, seen }));
			continue;
		}
		if (/^\s*#\s*include\s+</.test(line)) {
			continue;
		}
		out.push(line);
	}

	return out.join("\n");
}

module.exports = {
	SOURCE_EXTS,
	isSourceFile,
	isHeaderFile,
	toLuauPath,
	preprocess,
	isEngineStub,
};
