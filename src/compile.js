"use strict";

const path = require("path");
const { parse } = require("./parse");
const { emit } = require("./emit");
const { preprocess, isHeaderFile, toLuauPath, siblingImplementation, siblingHeader, implOutName } = require("./preprocess");
const { collectLibraries, insertPreamble } = require("./libs");
const { planOutput } = require("./architecture");
const { emitHeaderModule, primaryHeaderName } = require("./headers");

function shouldAttachRequires(name) {
	return !/\.(json)$/i.test(String(name || ""));
}

function attachRequires(contents, source, ast, options, outName) {
	if (!shouldAttachRequires(outName)) {
		return contents;
	}
	const libraries = String(contents).includes("CluauppLibs") ? [] : collectLibraries(source, ast);
	return insertPreamble(contents, options.moduleIncludes || [], libraries, outName);
}

function posixRel(from, file) {
	return path.relative(from, file).replace(/\\/g, "/");
}

function wireHeaderImpl(ast, fileName, options) {
	const headerPath = options.filePath || null;
	const impl = headerPath ? siblingImplementation(headerPath) : null;
	if (!impl) {
		return;
	}
	const typeName = primaryHeaderName(ast, options.relativeName || fileName);
	const implRel = options.srcDir ? posixRel(options.srcDir, impl) : path.basename(impl).replace(/\\/g, "/");
	const implOut = implOutName(implRel);
	options.headerImplName = `${typeName}Module`;
	options.moduleIncludes = options.moduleIncludes || [];
	if (!options.moduleIncludes.some((spec) => spec.name === options.headerImplName)) {
		options.moduleIncludes.push({
			name: options.headerImplName,
			outRel: implOut,
			exports: { consts: [], structs: [] },
		});
	}
}

function compileHeader(source, fileName, options, prepared, ast) {
	wireHeaderImpl(ast, fileName, options);
	const rel = (options.relativeName || fileName || "header.h").replace(/\\/g, "/");
	const outName = toLuauPath(rel);
	const luau = attachRequires(emitHeaderModule(ast, options), source, ast, options, outName);
	return {
		kind: "module",
		plan: { kind: "module", strict: options.strict === true },
		files: [{ name: outName, contents: luau }],
		stale: [],
	};
}

function compileSource(source, fileName, options = {}) {
	options.moduleIncludes = options.moduleIncludes || [];
	const prepared = preprocess(source, options.filePath || null, options);
	const ast = parse(prepared, fileName || "input.cpp");
	if (isHeaderFile(fileName) || isHeaderFile(options.filePath || "")) {
		return compileHeader(source, fileName, options, prepared, ast).files[0].contents;
	}
	const luau = emit(ast, options);
	return attachRequires(luau, source, ast, options, options.outName || fileName);
}

function compileService(source, fileName, options = {}) {
	options.moduleIncludes = options.moduleIncludes || [];
	const prepared = preprocess(source, options.filePath || null, options);
	const ast = parse(prepared, fileName || "input.cpp");
	if (isHeaderFile(fileName) || isHeaderFile(options.filePath || "") || isHeaderFile(options.relativeName || "")) {
		return compileHeader(source, fileName, options, prepared, ast);
	}
	const implHeader = options.filePath ? siblingHeader(options.filePath) : null;
	if (implHeader) {
		options.skipInit = true;
	}
	const planned = planOutput(ast, fileName || "input.cpp", {
		...options,
		relativeName: options.relativeName || fileName,
		source: prepared,
		siblingHeader: implHeader,
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
