"use strict";

const { parse } = require("./parse");
const { emit } = require("./emit");
const { preprocess } = require("./preprocess");
const { collectLibraries, insertRequires } = require("./libs");
const { planOutput } = require("./architecture");

function compileSource(source, fileName, options = {}) {
	const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
	const ast = parse(prepared, fileName || "input.cpp");
	const luau = emit(ast, options);
	return insertRequires(luau, collectLibraries(source, ast));
}

function compileService(source, fileName, options = {}) {
	const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
	const ast = parse(prepared, fileName || "input.cpp");
	const planned = planOutput(ast, fileName || "input.cpp", {
		...options,
		relativeName: options.relativeName || fileName,
		source: prepared,
	});
	if (planned.files) {
		return planned;
	}
	const luau = insertRequires(emit(ast, options), collectLibraries(source, ast));
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
