"use strict";

const { parse } = require("./parse");
const { emit } = require("./emit");
const { preprocess } = require("./preprocess");
const { collectLibraries, insertRequires, insertModuleRequires } = require("./libs");
const { planOutput } = require("./architecture");

function attachRequires(contents, source, ast, options, outName) {
	let next = contents;
	if (!next.includes("CluauppLibs")) {
		next = insertRequires(next, collectLibraries(source, ast));
	}
	return insertModuleRequires(next, options.moduleIncludes || [], outName);
}

function compileSource(source, fileName, options = {}) {
	options.moduleIncludes = options.moduleIncludes || [];
	const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
	const ast = parse(prepared, fileName || "input.cpp");
	const luau = emit(ast, options);
	return attachRequires(luau, source, ast, options, options.outName || fileName);
}

function compileService(source, fileName, options = {}) {
	options.moduleIncludes = options.moduleIncludes || [];
	const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
	const ast = parse(prepared, fileName || "input.cpp");
	const planned = planOutput(ast, fileName || "input.cpp", {
		...options,
		relativeName: options.relativeName || fileName,
		source: prepared,
	});
	if (planned.files) {
		return {
			...planned,
			files: planned.files.map((file) => ({
				...file,
				contents: attachRequires(file.contents, source, ast, options, file.name),
			})),
		};
	}
	const luau = attachRequires(emit(ast, options), source, ast, options, planned.outName || options.outName || fileName);
	const name =
		planned.outName ||
		options.outName ||
		String(fileName || "input.cpp").replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
	return {
		kind: planned.kind || "flat",
		plan: planned.plan,
		files: [{ name, contents: luau }],
		stale: planned.stale || [],
	};
}

module.exports = { compileSource, compileService };
