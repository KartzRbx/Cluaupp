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

function includeVariants(name) {
	const variants = [name];
	if (/\.h$/i.test(name)) {
		variants.push(name.replace(/\.h$/i, ".hpp"), name.replace(/\.h$/i, ".hh"));
	} else if (/\.hpp$/i.test(name)) {
		variants.push(name.replace(/\.hpp$/i, ".h"), name.replace(/\.hpp$/i, ".hh"));
	} else if (/\.hh$/i.test(name)) {
		variants.push(name.replace(/\.hh$/i, ".h"), name.replace(/\.hh$/i, ".hpp"));
	}
	return [...new Set(variants)];
}

function siblingImplementation(headerPath) {
	if (!headerPath || !isHeaderFile(headerPath)) {
		return null;
	}
	const base = headerPath.replace(/\.(h|hpp|hh)$/i, "");
	for (const ext of [".cpp", ".cc", ".cxx", ".c"]) {
		if (fs.existsSync(base + ext)) {
			return base + ext;
		}
	}
	return null;
}

function siblingHeader(implPath) {
	if (!implPath || isHeaderFile(implPath)) {
		return null;
	}
	const base = String(implPath).replace(/\.(cpp|cc|cxx|c)$/i, "");
	if (base === String(implPath)) {
		return null;
	}
	for (const ext of [".h", ".hpp", ".hh"]) {
		if (fs.existsSync(base + ext)) {
			return base + ext;
		}
	}
	return null;
}

function implOutName(rel) {
	return String(rel)
		.replace(/\\/g, "/")
		.replace(/\.(cpp|cc|cxx|c)$/i, "Impl.luau");
}

function resolveInclude(name, fromFile, includeDirs) {
	const bases = [path.dirname(fromFile), ...(includeDirs || [])];
	for (const base of bases) {
		for (const variant of includeVariants(name)) {
			const candidate = path.resolve(base, variant);
			if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
				return candidate;
			}
		}
	}
	return null;
}

function scanHeaderExports(source) {
	const consts = [];
	const structs = [];
	for (const match of String(source).matchAll(/\bconst\s+(?:int|bool|float|double|auto|string)\s+(\w+)/g)) {
		if (!consts.includes(match[1])) {
			consts.push(match[1]);
		}
	}
	for (const match of String(source).matchAll(/\bstruct\s+(\w+)/g)) {
		if (!structs.includes(match[1])) {
			structs.push(match[1]);
		}
	}
	const hasProtos = /\b(?:void|int|bool|float|double|auto|string|[\w:]+)\s+\w+\s*\([^;]*\)\s*;/.test(String(source));
	return { consts, structs, hasProtos };
}

function pushModuleInclude(options, resolved, impl) {
	options.moduleIncludes = options.moduleIncludes || [];
	const srcDir = options.srcDir || null;
	const moduleFile = impl || resolved;
	const rel = srcDir ? path.relative(srcDir, moduleFile).replace(/\\/g, "/") : path.basename(moduleFile);
	const headerText = fs.readFileSync(resolved, "utf8");
	options.moduleIncludes.push({
		name: path.basename(resolved).replace(/\.(h|hpp|hh)$/i, ""),
		outRel: rel.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau"),
		header: resolved,
		impl: impl || null,
		exports: scanHeaderExports(headerText),
	});
}

function applyPragmas(source, options) {
	let nstrict = false;
	let strict = false;
	for (const line of String(source).split(/\r?\n/)) {
		if (/^\s*#\s*pragma\s+nstrict\b/i.test(line)) {
			nstrict = true;
		} else if (/^\s*#\s*pragma\s+strict\b/i.test(line)) {
			strict = true;
		}
	}
	if (nstrict) {
		options.strict = false;
	} else if (strict) {
		options.strict = true;
	}
}

function preprocess(source, filePath, options = {}) {
	if (!options.pragmaResolved) {
		options.pragmaResolved = true;
		applyPragmas(source, options);
	}
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
			const impl = siblingImplementation(resolved);
			const including = filePath ? path.resolve(filePath) : null;
			const ownHeader = Boolean(impl && including && path.resolve(impl) === including);
			if (!ownHeader) {
				pushModuleInclude(options, resolved, impl);
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
	applyPragmas,
	preprocess,
	scanHeaderExports,
	isEngineStub,
	siblingImplementation,
	siblingHeader,
	implOutName,
	resolveInclude,
};
