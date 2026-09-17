import fs from "node:fs";
import path from "node:path";
import { parse } from "./parse.js";
import { emit } from "./emit.js";
import { preprocess, isHeaderFile, toLuauPath, siblingImplementation, siblingHeader, implOutName } from "./preprocess.js";
import { collectLibraries, insertPreamble } from "./libs.js";
import { planOutput } from "./architecture.js";
import { emitHeaderModule, primaryHeaderName } from "./headers.js";
import type { AstNode, AstProgram, ModuleInclude, PreprocessOptions } from "./ast.js";
import type { CompileOptions, CompileServiceResult } from "./types.js";

function shouldAttachRequires(name: string, contents: string): boolean {
	const file = String(name || "").replace(/\\/g, "/");
	if (/\.json$/i.test(file) || /\.meta\.json$/i.test(file)) {
		return false;
	}
	const trimmed = String(contents || "").trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		return false;
	}
	return true;
}

function attachRequires(contents: string, source: string, ast: AstProgram, options: PreprocessOptions, outName: string): string {
	if (!shouldAttachRequires(outName, contents)) {
		return contents;
	}
	const libraries = String(contents).includes("CluauppLibs") ? [] : collectLibraries(source, ast);
	return insertPreamble(contents, options.moduleIncludes || [], libraries, outName);
}

function posixRel(from: string, file: string): string {
	return path.relative(from, file).replace(/\\/g, "/");
}

function declKey(decl: AstNode): string {
	return `${decl.owner || ""}::${decl.name}`;
}

function mergeSiblingImpl(ast: AstProgram, implPath: string, options: PreprocessOptions): void {
	const implOptions: PreprocessOptions = {
		...options,
		moduleIncludes: [],
		seen: new Set(),
		pragmaResolved: false,
	};
	const prepared = preprocess(fs.readFileSync(implPath, "utf8"), implPath, implOptions);
	const implAst = parse(prepared, path.basename(implPath)) as AstProgram;
	if (!Array.isArray(ast.body)) {
		ast.body = [];
	}
	const existing = new Set(
		(ast.body || [])
			.filter((decl) => decl && (decl.type === "function" || decl.type === "proto") && decl.name)
			.map(declKey),
	);
	for (const decl of implAst.body || []) {
		if ((decl.type !== "function" && decl.type !== "proto") || !decl.name) {
			continue;
		}
		const key = declKey(decl);
		if (existing.has(key)) {
			continue;
		}
		existing.add(key);
		ast.body.push({
			type: "proto",
			name: decl.name,
			owner: decl.owner,
			returnType: decl.returnType,
			params: decl.params,
		});
	}
}

function wireHeaderImpl(ast: AstProgram, fileName: string, options: PreprocessOptions): void {
	const headerPath = options.filePath || null;
	const impl = headerPath ? siblingImplementation(headerPath) : null;
	if (!impl) {
		return;
	}
	mergeSiblingImpl(ast, impl, options);
	const typeName = primaryHeaderName(ast, options.relativeName || fileName);
	const implRel = options.srcDir ? posixRel(options.srcDir, impl) : path.basename(impl).replace(/\\/g, "/");
	const implOut = implOutName(implRel);
	options.headerImplName = `${typeName}Module`;
	options.moduleIncludes = options.moduleIncludes || [];
	if (!options.moduleIncludes.some((spec: ModuleInclude) => spec.name === options.headerImplName)) {
		options.moduleIncludes.push({
			name: options.headerImplName,
			outRel: implOut,
			exports: { consts: [], structs: [] },
		});
	}
}

function compileHeader(source: string, fileName: string, options: PreprocessOptions, ast: AstProgram): CompileServiceResult {
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

export function compileSource(source: string, fileName?: string, options: CompileOptions = {}): string {
	const opts = options as PreprocessOptions;
	opts.moduleIncludes = opts.moduleIncludes || [];
	const prepared = preprocess(source, opts.filePath || null, opts);
	const ast = parse(prepared, fileName || "input.cpp");
	if (isHeaderFile(fileName || "") || isHeaderFile(opts.filePath || "")) {
		return compileHeader(source, fileName || "header.h", opts, ast).files[0].contents;
	}
	const luau = emit(ast, opts);
	return attachRequires(luau, source, ast, opts, opts.outName || fileName || "input.cpp");
}

export function compileService(source: string, fileName?: string, options: CompileOptions = {}): CompileServiceResult {
	const opts = options as PreprocessOptions;
	opts.moduleIncludes = opts.moduleIncludes || [];
	const prepared = preprocess(source, opts.filePath || null, opts);
	const ast = parse(prepared, fileName || "input.cpp");
	if (isHeaderFile(fileName || "") || isHeaderFile(opts.filePath || "") || isHeaderFile(opts.relativeName || "")) {
		return compileHeader(source, fileName || "header.h", opts, ast);
	}
	const implHeader = opts.filePath ? siblingHeader(opts.filePath) : null;
	if (implHeader) {
		opts.skipInit = true;
	}
	const planned = planOutput(ast, fileName || "input.cpp", {
		...opts,
		relativeName: opts.relativeName || fileName,
		source: prepared,
		siblingHeader: implHeader,
	});
	if (planned.files) {
		return {
			...planned,
			files: planned.files.map((file: { name: string; contents: string }) => ({
				...file,
				contents: attachRequires(file.contents, source, ast, opts, file.name),
			})),
		};
	}
	const luau = attachRequires(emit(ast, opts), source, ast, opts, planned.outName || opts.outName || fileName || "input.cpp");
	const name =
		planned.outName ||
		opts.outName ||
		String(fileName || "input.cpp").replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
	return {
		kind: planned.kind || "flat",
		plan: planned.plan,
		files: [{ name, contents: luau }],
		stale: planned.stale || [],
	};
}
