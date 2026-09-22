import path from "node:path";
import fs from "node:fs";
import type { CompileOptions, CompileServiceResult } from "./types.js";
import { compileViaClpp, compileViaClppAsync } from "./clpp/runner.js";
import { clppLuauToGame, shouldSkipInit } from "./clpp/postprocess.js";
import { emitKind, siblingHeader, toLuauPath } from "./clpp/paths.js";
import type { CompileArtifact } from "./clpp/contract.js";
import { projectRoot } from "./package-info.js";
import { runContextFromFileName } from "./target/roblox.js";
import { capabilityProfilePath, writeCapabilityProfile, loadCapabilityProfile } from "./target/capability-profile.js";
import { assertContextSafe, listContextWarnings, formatContextViolations } from "./target/context-check.js";
import { buildDatamodelProfile } from "./target/datamodel.js";
import { assertDatamodelSafe } from "./target/datamodel-check.js";
import { writeDatamodelArtifacts } from "./target/datamodel-generate.js";
import { assertParallelSafe } from "./target/parallel-check.js";
import { assertAuthoritySafe, loadPlatformPolicy } from "./target/authority-check.js";

function defaultTargetProfilePath(): string | undefined {
	const cached = path.join(projectRoot, "api", "normalized", "roblox-target.profile.json");
	if (fs.existsSync(cached)) {
		return cached.replace(/\\/g, "/");
	}
	return undefined;
}

function ensureCapabilityProfile(): string {
	const file = capabilityProfilePath();
	if (!fs.existsSync(file)) {
		writeCapabilityProfile();
	}
	return file.replace(/\\/g, "/");
}

function resolveGameRoot(options: CompileOptions): string {
	const start = options.rootDir
		? path.resolve(options.rootDir)
		: options.filePath
			? path.dirname(path.resolve(options.filePath))
			: process.cwd();
	let dir = start;
	for (let i = 0; i < 8; i++) {
		if (fs.existsSync(path.join(dir, "default.project.json")) || fs.existsSync(path.join(dir, "default.project.jsonc"))) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return options.rootDir ? path.resolve(options.rootDir) : process.cwd();
}

function ensureDatamodel(options: CompileOptions): { profilePath?: string; profile: ReturnType<typeof buildDatamodelProfile> } {
	const root = resolveGameRoot(options);
	const written = writeDatamodelArtifacts(root);
	if (written) {
		return { profilePath: written.profilePath.replace(/\\/g, "/"), profile: written.profile };
	}
	return { profile: buildDatamodelProfile(root) };
}

function compileArgs(source: string, fileName: string | undefined, options: CompileOptions) {
	const relative = (options.relativeName || fileName || "input.clpp").replace(/\\/g, "/");
	const outName = options.outName || toLuauPath(relative);
	const header = options.filePath ? siblingHeader(options.filePath) : null;
	const skipInit = options.skipInit === true || shouldSkipInit(relative, Boolean(header));
	const diskPath = options.filePath ? path.resolve(options.filePath) : null;
	const runContext = runContextFromFileName(relative);
	const dm = ensureDatamodel(options);
	const gameRoot = resolveGameRoot(options);
	return {
		request: {
			source,
			fileName: diskPath ? diskPath.replace(/\\/g, "/") : relative,
			strict: options.strict,
			cwd: diskPath ? path.dirname(diskPath) : options.srcDir,
			targetProfilePath: defaultTargetProfilePath(),
			targetCacheDir: path.join(projectRoot, "api", ".cache").replace(/\\/g, "/"),
			runContext,
			capabilityProfilePath: ensureCapabilityProfile(),
			datamodelProfilePath: dm.profilePath,
		},
		relative,
		outName,
		skipInit,
		options,
		datamodel: dm.profile,
		gameRoot,
		policy: loadPlatformPolicy(gameRoot),
	};
}

function enforcePlatform(source: string, relative: string, args: ReturnType<typeof compileArgs>): void {
	const profile = loadCapabilityProfile();
	assertContextSafe(source, relative, profile);
	const warnings = listContextWarnings(source, relative, profile);
	if (warnings.length) {
		console.warn(formatContextViolations(relative, warnings));
	}
	if (args.datamodel) {
		assertDatamodelSafe(source, args.datamodel);
	}
	assertParallelSafe(source, relative);
	assertAuthoritySafe(source, relative, args.policy);
}

function finishArtifact(
	artifact: CompileArtifact,
	relative: string,
	outName: string,
	options: CompileOptions,
	skipInit: boolean,
	source: string,
): CompileServiceResult {
	const luau = clppLuauToGame(artifact, {
		relativeName: relative,
		outName,
		srcDir: options.srcDir,
		rootDir: options.rootDir,
		strict: options.strict,
		skipInit,
		source,
	});
	return {
		kind: emitKind(relative),
		plan: { kind: emitKind(relative), strict: options.strict === true },
		files: [{ name: outName, contents: luau }],
		stale: [],
	};
}

export function compileSource(source: string, fileName?: string, options: CompileOptions = {}): string {
	return compileService(source, fileName, options).files[0]?.contents ?? "";
}

export function compileService(source: string, fileName?: string, options: CompileOptions = {}): CompileServiceResult {
	const args = compileArgs(source, fileName, options);
	enforcePlatform(source, args.relative, args);
	const artifact = compileViaClpp(args.request);
	return finishArtifact(artifact, args.relative, args.outName, args.options, args.skipInit, source);
}

export async function compileServiceAsync(source: string, fileName?: string, options: CompileOptions = {}): Promise<CompileServiceResult> {
	const args = compileArgs(source, fileName, options);
	enforcePlatform(source, args.relative, args);
	const artifact = await compileViaClppAsync(args.request);
	return finishArtifact(artifact, args.relative, args.outName, args.options, args.skipInit, source);
}
