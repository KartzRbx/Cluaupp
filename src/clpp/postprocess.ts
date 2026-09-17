import { insertPreamble, MODULES, requireCluauppLib } from "../libs.js";
import type { CompileArtifact } from "./contract.js";
import { isTaggedScript } from "./paths.js";

export type PostprocessOptions = {
	relativeName: string;
	outName: string;
	srcDir?: string;
	rootDir?: string;
	strict?: boolean;
	skipInit?: boolean;
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

function rewriteClppLibs(luau: string): string {
	return String(luau).replace(/require\(\s*ClppLibs\.([A-Za-z0-9_]+)\s*\)/g, (_all, name: string) => {
		return requireCluauppLib(name);
	});
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

function librarySpecs(names: string[] | undefined) {
	const specs: Array<{ file: string; bind: string }> = [];
	const seen = new Set<string>();
	for (const name of names || []) {
		const spec = (MODULES as Record<string, { file: string; bind: string }>)[name];
		if (!spec || seen.has(spec.bind)) {
			continue;
		}
		seen.add(spec.bind);
		specs.push(spec);
	}
	return specs;
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
	let luau = rewriteClppLibs(artifact.luau || "");
	luau = ensureReplicatedStorage(luau);
	if (options.skipInit) {
		luau = stripInitCall(luau);
	}
	luau = ensureStrict(luau, options.strict);
	const missing = missingLibraries(luau, artifact.libraries);
	if (missing.length > 0) {
		luau = insertPreamble(luau, [], missing, options.outName);
	}
	return luau;
}
