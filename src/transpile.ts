import path from "node:path";
import type { CompileOptions, CompileServiceResult, TranspilerState } from "./types.js";
import { ASTCollector } from "./parser/collector.js";
import { parseCpp } from "./parser/index.js";
import { LuauCodeEmitter } from "./emitter/luau-codegen.js";
import { compileService } from "./compile.js";
import { determineArchitecture } from "./system-understander.js";
import type { RojoMapper } from "./utils/rojo-mapper.js";

function shouldMerge(name: string, contents: string): boolean {
	const file = String(name || "").replace(/\\/g, "/");
	if (/\.json$/i.test(file) || /\.meta\.json$/i.test(file)) {
		return false;
	}
	const trimmed = String(contents || "").trim();
	return !(trimmed.startsWith("{") || trimmed.startsWith("["));
}

export function collectState(source: string, mapper: RojoMapper, options: CompileOptions): TranspilerState {
	const tree = parseCpp(source);
	if (!tree) {
		const state = LuauCodeEmitter.emptyState(options.strict === true);
		return state;
	}
	const collector = new ASTCollector(mapper, {
		fileName: options.relativeName || options.filePath || "input.cpp",
		sourcePath: options.filePath,
		srcDir: options.srcDir,
		outDir: options.outDir,
		strict: options.strict,
	});
	const state = collector.collect(tree.rootNode);
	const report = determineArchitecture(options.relativeName || options.filePath || "input.cpp", null, tree.rootNode);
	for (const service of report.injectedServices) {
		state.robloxServices.add(service);
	}
	for (const line of report.reasoning) {
		state.headerLines.push(`-- ${line}`);
	}
	return state;
}

export function transpileSource(source: string, fileName: string, options: CompileOptions, mapper: RojoMapper): CompileServiceResult {
	const state = collectState(source, mapper, options);
	if (state.strict) {
		options.strict = true;
	}
	const compiled = compileService(source, fileName, options);
	return {
		...compiled,
		files: compiled.files.map((file) => ({
			...file,
			contents: shouldMerge(file.name, file.contents) ? LuauCodeEmitter.merge(state, file.contents) : file.contents,
		})),
	};
}

export function outputNameFor(inputFile: string, outputPath: string): string {
	if (/\.luau$/i.test(outputPath)) {
		return outputPath;
	}
	const base = path.basename(inputFile).replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
	return path.join(outputPath, base);
}
