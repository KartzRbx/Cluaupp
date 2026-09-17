"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSource = compileSource;
exports.compileService = compileService;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const parse_js_1 = require("./parse.js");
const emit_js_1 = require("./emit.js");
const preprocess_js_1 = require("./preprocess.js");
const libs_js_1 = require("./libs.js");
const architecture_js_1 = require("./architecture.js");
const headers_js_1 = require("./headers.js");
function shouldAttachRequires(name, contents) {
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
function attachRequires(contents, source, ast, options, outName) {
    if (!shouldAttachRequires(outName, contents)) {
        return contents;
    }
    const libraries = String(contents).includes("CluauppLibs") ? [] : (0, libs_js_1.collectLibraries)(source, ast);
    return (0, libs_js_1.insertPreamble)(contents, options.moduleIncludes || [], libraries, outName);
}
function posixRel(from, file) {
    return node_path_1.default.relative(from, file).replace(/\\/g, "/");
}
function declKey(decl) {
    return `${decl.owner || ""}::${decl.name}`;
}
function mergeSiblingImpl(ast, implPath, options) {
    const implOptions = {
        ...options,
        moduleIncludes: [],
        seen: new Set(),
        pragmaResolved: false,
    };
    const prepared = (0, preprocess_js_1.preprocess)(node_fs_1.default.readFileSync(implPath, "utf8"), implPath, implOptions);
    const implAst = (0, parse_js_1.parse)(prepared, node_path_1.default.basename(implPath));
    if (!Array.isArray(ast.body)) {
        ast.body = [];
    }
    const existing = new Set((ast.body || [])
        .filter((decl) => decl && (decl.type === "function" || decl.type === "proto") && decl.name)
        .map(declKey));
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
function wireHeaderImpl(ast, fileName, options) {
    const headerPath = options.filePath || null;
    const impl = headerPath ? (0, preprocess_js_1.siblingImplementation)(headerPath) : null;
    if (!impl) {
        return;
    }
    mergeSiblingImpl(ast, impl, options);
    const typeName = (0, headers_js_1.primaryHeaderName)(ast, options.relativeName || fileName);
    const implRel = options.srcDir ? posixRel(options.srcDir, impl) : node_path_1.default.basename(impl).replace(/\\/g, "/");
    const implOut = (0, preprocess_js_1.implOutName)(implRel);
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
function compileHeader(source, fileName, options, ast) {
    wireHeaderImpl(ast, fileName, options);
    const rel = (options.relativeName || fileName || "header.h").replace(/\\/g, "/");
    const outName = (0, preprocess_js_1.toLuauPath)(rel);
    const luau = attachRequires((0, headers_js_1.emitHeaderModule)(ast, options), source, ast, options, outName);
    return {
        kind: "module",
        plan: { kind: "module", strict: options.strict === true },
        files: [{ name: outName, contents: luau }],
        stale: [],
    };
}
function compileSource(source, fileName, options = {}) {
    const opts = options;
    opts.moduleIncludes = opts.moduleIncludes || [];
    const prepared = (0, preprocess_js_1.preprocess)(source, opts.filePath || null, opts);
    const ast = (0, parse_js_1.parse)(prepared, fileName || "input.cpp");
    if ((0, preprocess_js_1.isHeaderFile)(fileName || "") || (0, preprocess_js_1.isHeaderFile)(opts.filePath || "")) {
        return compileHeader(source, fileName || "header.h", opts, ast).files[0].contents;
    }
    const luau = (0, emit_js_1.emit)(ast, opts);
    return attachRequires(luau, source, ast, opts, opts.outName || fileName || "input.cpp");
}
function compileService(source, fileName, options = {}) {
    const opts = options;
    opts.moduleIncludes = opts.moduleIncludes || [];
    const prepared = (0, preprocess_js_1.preprocess)(source, opts.filePath || null, opts);
    const ast = (0, parse_js_1.parse)(prepared, fileName || "input.cpp");
    if ((0, preprocess_js_1.isHeaderFile)(fileName || "") || (0, preprocess_js_1.isHeaderFile)(opts.filePath || "") || (0, preprocess_js_1.isHeaderFile)(opts.relativeName || "")) {
        return compileHeader(source, fileName || "header.h", opts, ast);
    }
    const implHeader = opts.filePath ? (0, preprocess_js_1.siblingHeader)(opts.filePath) : null;
    if (implHeader) {
        opts.skipInit = true;
    }
    const planned = (0, architecture_js_1.planOutput)(ast, fileName || "input.cpp", {
        ...opts,
        relativeName: opts.relativeName || fileName,
        source: prepared,
        siblingHeader: implHeader,
    });
    if (planned.files) {
        return {
            ...planned,
            files: planned.files.map((file) => ({
                ...file,
                contents: attachRequires(file.contents, source, ast, opts, file.name),
            })),
        };
    }
    const luau = attachRequires((0, emit_js_1.emit)(ast, opts), source, ast, opts, planned.outName || opts.outName || fileName || "input.cpp");
    const name = planned.outName ||
        opts.outName ||
        String(fileName || "input.cpp").replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
    return {
        kind: planned.kind || "flat",
        plan: planned.plan,
        files: [{ name, contents: luau }],
        stale: planned.stale || [],
    };
}
