import type { CompileOptions, CompileServiceResult } from "./types.js";
import { compileViaClpp } from "./clpp/runner.js";
import { clppLuauToGame, shouldSkipInit } from "./clpp/postprocess.js";
import { emitKind, siblingHeader, toLuauPath } from "./clpp/paths.js";

export function compileSource(source: string, fileName?: string, options: CompileOptions = {}): string {
	return compileService(source, fileName, options).files[0]?.contents ?? "";
}

export function compileService(source: string, fileName?: string, options: CompileOptions = {}): CompileServiceResult {
	const relative = (options.relativeName || fileName || "input.clpp").replace(/\\/g, "/");
	const outName = options.outName || toLuauPath(relative);
	const header = options.filePath ? siblingHeader(options.filePath) : null;
	const skipInit = options.skipInit === true || shouldSkipInit(relative, Boolean(header));
	const artifact = compileViaClpp({
		source,
		fileName: relative,
		strict: options.strict,
	});
	const luau = clppLuauToGame(artifact, {
		relativeName: relative,
		outName,
		srcDir: options.srcDir,
		rootDir: options.rootDir,
		strict: options.strict,
		skipInit,
	});
	return {
		kind: emitKind(relative),
		plan: { kind: emitKind(relative), strict: options.strict === true },
		files: [{ name: outName, contents: luau }],
		stale: [],
	};
}
