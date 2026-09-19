import { insertPreamble, libraryNamesFromIncludes, MODULES, requireCluauppLib } from "../libs.js";
import type { CompileArtifact } from "./contract.js";
import { isTaggedScript } from "./paths.js";

export type PostprocessOptions = {
	relativeName: string;
	outName: string;
	srcDir?: string;
	rootDir?: string;
	strict?: boolean;
	skipInit?: boolean;
	source?: string;
};

function insertAfterHeader(luau: string, block: string): string {
	const match = String(luau).match(/^(?:--[^\n]*\n)+/);
	if (!match) {
		return `${block}\n${luau}`;
	}
	const insertAt = match[0].length;
	const rest = luau.slice(insertAt).replace(/^\n*/, "\n");
	return `${luau.slice(0, insertAt)}\n${block}\n${rest}`;
}

const CLPP_LIB_FILE: Record<string, string> = {
	Janitor: "Sweep",
	Signal: "Spark",
	MathUtils: "Axiom",
	FormatNumber: "Mint",
	Module3D: "Stage",
	Twinkle: "Bloom",
	EzVisualz: "Bloom",
	Spring: "Coil",
	Display: "Trace",
	StickyBillboard: "Pin",
	Icon: "Crest",
	TopbarPlus: "Crest",
	Cmdr: "Helm",
	Chrono: "Echo",
	Iris: "Lens",
	Fusion: "Gleam",
	StateMachine: "Shift",
	VfxUtil: "Ember",
	DataService: "Keep",
	TutorialKit: "Guide",
	TutorialServer: "Guide",
};

function rewriteClppLibs(luau: string, relativeName?: string): string {
	let next = String(luau).replace(/require\(\s*ClppLibs\.([A-Za-z0-9_]+)\s*\)/g, (_all, name: string) => {
		return requireCluauppLib(CLPP_LIB_FILE[name] || name);
	});
	next = next.replace(/CluauppLibs\.Janitor\b/g, "CluauppLibs.Sweep");
	next = next.replace(/CluauppLibs\.Signal\b/g, "CluauppLibs.Spark");
	next = next.replace(/:Add\(([^,\n()]+),\s*"Disconnect"\s*\)/g, ":Add($1)");
	const tagged = relativeName ? isTaggedScript(relativeName) : false;
	const hasConnect = /:Connect\(/.test(next);
	const hasSweep = /CluauppLibs\.Sweep/.test(next) || /\bjanitor\b/.test(next) || /\bsweep\b/.test(next);
	if (tagged && hasConnect && !hasSweep) {
		next = insertAfterHeader(next, "local sweep = require(ReplicatedStorage.CluauppLibs.Sweep).new()");
	}
	return next;
}

function ensureReplicatedStorage(luau: string): string {
	if (!luau.includes("CluauppLibs")) {
		return luau;
	}
	if (/GetService\(\s*"ReplicatedStorage"\s*\)/.test(luau)) {
		return luau;
	}
	return insertAfterHeader(luau, 'const ReplicatedStorage = game:GetService("ReplicatedStorage")');
}

function stripInitCall(luau: string): string {
	return String(luau).replace(/\ninit\(\)\s*\n?$/m, "\n");
}

function ensureStrict(luau: string, strict?: boolean): string {
	if (!strict || /^\s*--!strict\b/m.test(luau)) {
		return luau;
	}
	if (luau.startsWith("--")) {
		return `--!strict\n${luau}`;
	}
	return `--!strict\n${luau}`;
}

function normalizeLibraryName(name: string): string | null {
	const mapped = CLPP_LIB_FILE[name] || name;
	if ((MODULES as Record<string, { file: string; bind: string }>)[mapped]) {
		return mapped;
	}
	return null;
}

function librarySpecs(names: string[] | undefined) {
	const specs: Array<{ file: string; bind: string }> = [];
	const seen = new Set<string>();
	for (const name of names || []) {
		const mapped = normalizeLibraryName(name);
		if (!mapped) {
			continue;
		}
		const spec = (MODULES as Record<string, { file: string; bind: string }>)[mapped];
		if (!spec || seen.has(spec.bind)) {
			continue;
		}
		seen.add(spec.bind);
		specs.push(spec);
	}
	return specs;
}

function includedLibraryNames(artifact: CompileArtifact, source?: string): string[] {
	const names: string[] = [];
	for (const name of artifact.libraries || []) {
		if (name === "*") {
			names.push(...Object.keys(MODULES));
			continue;
		}
		names.push(name);
	}
	if (source) {
		names.push(...(libraryNamesFromIncludes(source) as string[]));
	}
	return names;
}

function missingLibraries(luau: string, names: string[] | undefined) {
	return librarySpecs(names).filter((spec) => {
		return !luau.includes(`CluauppLibs.${spec.file}`) && !new RegExp(`\\bconst ${spec.bind}\\b`).test(luau);
	});
}

export function shouldSkipInit(fileName: string, hasSiblingHeader: boolean): boolean {
	if (!hasSiblingHeader) {
		return false;
	}
	return !isTaggedScript(fileName);
}

export function clppLuauToGame(artifact: CompileArtifact, options: PostprocessOptions): string {
	let luau = rewriteClppLibs(artifact.luau || "", options.relativeName);
	luau = ensureReplicatedStorage(luau);
	if (options.skipInit) {
		luau = stripInitCall(luau);
	}
	luau = ensureStrict(luau, options.strict);
	const missing = missingLibraries(luau, includedLibraryNames(artifact, options.source));
	if (missing.length > 0) {
		luau = insertPreamble(luau, [], missing, options.outName);
	}
	return luau;
}
