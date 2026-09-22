/**
 * CL++ 0.8 module surface for the Cluaupp host.
 * Canonical: `import { Name } from "./path.clh"` — `#include` remains legacy / angle prelude.
 */

import fs from "node:fs";
import path from "node:path";

export type ModuleRefKind = "import" | "include";

export interface NamedImportBinding {
	name: string;
	alias: string;
}

export interface ModuleRef {
	kind: ModuleRefKind;
	/** Raw path text from source (quoted or angle body). */
	modulePath: string;
	/** Angle `#include <…>` (host prelude) — not a language module. */
	angled: boolean;
	bindings: NamedImportBinding[];
	index: number;
}

const IMPORT_RE =
	/\bimport\s*\{([^}]*)\}\s*from\s*"([^"]+)"\s*;?/g;
const INCLUDE_RE = /#\s*include\s*(?:<([^>]+)>|"([^"]+)")/g;

function parseBindings(inner: string): NamedImportBinding[] {
	const out: NamedImportBinding[] = [];
	for (const part of inner.split(",")) {
		const piece = part.trim();
		if (!piece) continue;
		const asMatch = /^([A-Za-z_]\w*)\s+as\s+([A-Za-z_]\w*)$/.exec(piece);
		if (asMatch) {
			out.push({ name: asMatch[1], alias: asMatch[2] });
			continue;
		}
		const ident = /^([A-Za-z_]\w*)$/.exec(piece);
		if (ident) {
			out.push({ name: ident[1], alias: ident[1] });
		}
	}
	return out;
}

/** Collect every `import { … } from` and quoted/angle `#include` in source order. */
export function collectModuleRefs(source: string): ModuleRef[] {
	const refs: ModuleRef[] = [];
	const text = String(source);

	IMPORT_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = IMPORT_RE.exec(text))) {
		refs.push({
			kind: "import",
			modulePath: m[2].replace(/\\/g, "/"),
			angled: false,
			bindings: parseBindings(m[1]),
			index: m.index,
		});
	}

	INCLUDE_RE.lastIndex = 0;
	while ((m = INCLUDE_RE.exec(text))) {
		const angled = Boolean(m[1]);
		const modulePath = (m[1] || m[2] || "").replace(/\\/g, "/");
		if (!modulePath) continue;
		refs.push({
			kind: "include",
			modulePath,
			angled,
			bindings: [],
			index: m.index,
		});
	}

	refs.sort((a, b) => a.index - b.index);
	return refs;
}

/** Language modules only — named imports + quoted includes (not angle `<clpp/…>`). */
export function collectLanguageModulePaths(source: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const ref of collectModuleRefs(source)) {
		if (ref.angled) continue;
		if (seen.has(ref.modulePath)) continue;
		seen.add(ref.modulePath);
		out.push(ref.modulePath);
	}
	return out;
}

export function isAnglePlatformInclude(modulePath: string): boolean {
	const p = modulePath.replace(/\\/g, "/").toLowerCase();
	return (
		p.startsWith("clpp/") ||
		p.startsWith("cluaupp/") ||
		p.startsWith("cluau/") ||
		p === "roblox.clh" ||
		p.endsWith("/roblox.clh")
	);
}

/** Resolve a module path relative to the importing file (and optional src root). */
export function resolveModuleFile(
	modulePath: string,
	fromFile: string,
	srcDir?: string,
): string | null {
	const raw = modulePath.replace(/[<>'"]/g, "").trim();
	if (!raw || isAnglePlatformInclude(raw)) {
		return null;
	}
	const bases: string[] = [path.dirname(fromFile)];
	if (srcDir) {
		bases.push(srcDir);
	}
	for (const base of bases) {
		const candidate = path.resolve(base, raw);
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
		// Allow omitting extension when the stem matches a source file.
		for (const ext of [".clh", ".clp", ".clpp"]) {
			const withExt = candidate.endsWith(ext) ? candidate : candidate + ext;
			if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
				return withExt;
			}
		}
	}
	return null;
}

/** Absolute paths of language deps (one hop). */
export function resolveLanguageDeps(source: string, fromFile: string, srcDir?: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const mod of collectLanguageModulePaths(source)) {
		const resolved = resolveModuleFile(mod, fromFile, srcDir);
		if (!resolved) continue;
		const key = path.resolve(resolved);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(key);
	}
	return out;
}

/**
 * Fingerprint source + one-hop language deps so import/include edits invalidate incremental cache.
 */
export function fingerprintSourceWithDeps(
	source: string,
	fromFile: string,
	configKey: string,
	srcDir: string | undefined,
	hashText: (text: string) => string,
): string {
	const parts = [configKey, source];
	for (const dep of resolveLanguageDeps(source, fromFile, srcDir)) {
		try {
			parts.push(`\n//dep:${dep.replace(/\\/g, "/")}\n`);
			parts.push(fs.readFileSync(dep, "utf8"));
		} catch {
			parts.push(`\n//dep-missing:${dep.replace(/\\/g, "/")}\n`);
		}
	}
	return hashText(parts.join(""));
}

/** Rewrite CL++ `script.Parent…Service…` walks to game-rooted requires. */
export function rewriteGameRootedRequires(luau: string): string {
	let next = String(luau);
	const services = [
		"ReplicatedStorage",
		"ReplicatedFirst",
		"ServerScriptService",
		"ServerStorage",
		"StarterPlayer",
		"StarterGui",
		"Workspace",
	];
	for (const svc of services) {
		const re = new RegExp(`script(?:\\.Parent)+\\.${svc}\\.`, "g");
		next = next.replace(re, `${svc}.`);
	}
	return next;
}

/** Ensure GetService lines exist for any game-rooted require used. */
export function ensureGameServices(luau: string): string {
	let next = String(luau);
	const needed: string[] = [];
	for (const svc of ["ReplicatedStorage", "ReplicatedFirst", "ServerScriptService", "ServerStorage", "StarterPlayer"]) {
		if (new RegExp(`require\\(${svc}\\.`).test(next) && !new RegExp(`GetService\\(\\s*"${svc}"\\s*\\)`).test(next)) {
			needed.push(svc);
		}
	}
	if (needed.length === 0) {
		return next;
	}
	const block = needed.map((svc) => `const ${svc} = game:GetService("${svc}")`).join("\n");
	const match = next.match(/^(?:--[^\n]*\n)+/);
	if (!match) {
		return `${block}\n${next}`;
	}
	const insertAt = match[0].length;
	const rest = next.slice(insertAt).replace(/^\n*/, "\n");
	return `${next.slice(0, insertAt)}\n${block}\n${rest}`;
}

/** Selective `@native` from CompileArtifact.nativeHints (never blanket). */
export function applyNativeHintsToLuau(luau: string, hints: string[] | undefined): string {
	const set = new Set((hints || []).filter(Boolean));
	if (set.size === 0) {
		return luau;
	}
	const lines = luau.split(/\r?\n/);
	const out: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = line.match(/^(\s*)(local\s+function|function)\s+([A-Za-z_][\w.:]*)/);
		if (m) {
			const short = m[3].includes(":") ? m[3].split(":").pop()! : m[3].split(".").pop()!;
			if ((set.has(m[3]) || set.has(short)) && (i === 0 || !lines[i - 1].includes("@native"))) {
				out.push(`${m[1]}@native`);
			}
		}
		out.push(line);
	}
	return out.join("\n");
}

export function planLayoutFromHints(layoutHints: string[] | undefined): { soa: string[]; buffer: string[] } {
	const soa: string[] = [];
	const buffer: string[] = [];
	for (const h of layoutHints || []) {
		if (h.startsWith("SoA:") || h.startsWith("SoACandidate:")) {
			soa.push(h.replace(/^SoA(Candidate)?:/, ""));
		} else if (
			h.startsWith("BufferSpecialize:") ||
			h.startsWith("BufferCandidate:") ||
			h.startsWith("DenseNumeric:")
		) {
			buffer.push(h.split(":")[1] ?? h);
		}
	}
	return { soa, buffer };
}
