import fs from "node:fs";
import path from "node:path";
import type { ModuleInclude, PreprocessOptions } from "./ast.js";

export const SOURCE_EXTS = [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hh"];

export function isSourceFile(fileName: string): boolean {
	return SOURCE_EXTS.includes(path.extname(fileName).toLowerCase());
}

export function isHeaderFile(fileName: string): boolean {
	return [".h", ".hpp", ".hh"].includes(path.extname(fileName).toLowerCase());
}

export function toLuauPath(filePath: string): string {
	return filePath.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
}

export function isEngineStub(filePath: string): boolean {
	const normalized = filePath.replace(/\\/g, "/").toLowerCase();
	return (
		normalized.includes("/include/cluaupp/") ||
		normalized.includes("/include/cluau/") ||
		normalized.endsWith("/roblox.hpp") ||
		normalized.endsWith("/roblox.h")
	);
}

function includeVariants(name: string): string[] {
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

export function siblingImplementation(headerPath: string | null | undefined): string | null {
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

export function siblingHeader(implPath: string | null | undefined): string | null {
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

export function implOutName(rel: string): string {
	return String(rel)
		.replace(/\\/g, "/")
		.replace(/\.(cpp|cc|cxx|c)$/i, "Impl.luau");
}

export function resolveInclude(name: string, fromFile: string, includeDirs?: string[]): string | null {
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

export function scanHeaderExports(source: string): { consts: string[]; structs: string[]; hasProtos: boolean } {
	const consts: string[] = [];
	const structs: string[] = [];
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

function pushModuleInclude(options: PreprocessOptions, resolved: string, impl: string | null): void {
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

export function applyPragmas(source: string, options: PreprocessOptions): void {
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

export function preprocess(source: string, filePath: string | null, options: PreprocessOptions = {}): string {
	if (!options.pragmaResolved) {
		options.pragmaResolved = true;
		applyPragmas(source, options);
	}
	const seen = options.seen || new Set<string>();
	options.seen = seen;
	const includeDirs = options.includeDirs || [];
	const resolvedSelf = filePath ? path.resolve(filePath) : null;
	if (resolvedSelf) {
		seen.add(resolvedSelf);
	}

	const lines = String(source).split(/\r?\n/);
	const out: string[] = [];

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
