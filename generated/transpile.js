"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectState = collectState;
exports.transpileSource = transpileSource;
exports.outputNameFor = outputNameFor;
const node_path_1 = __importDefault(require("node:path"));
const collector_js_1 = require("./parser/collector.js");
const index_js_1 = require("./parser/index.js");
const luau_codegen_js_1 = require("./emitter/luau-codegen.js");
const compile_js_1 = require("./compile.js");
const system_understander_js_1 = require("./system-understander.js");
function shouldMerge(name, contents) {
    const file = String(name || "").replace(/\\/g, "/");
    if (/\.json$/i.test(file) || /\.meta\.json$/i.test(file)) {
        return false;
    }
    const trimmed = String(contents || "").trim();
    return !(trimmed.startsWith("{") || trimmed.startsWith("["));
}
function collectState(source, mapper, options) {
    const tree = (0, index_js_1.parseCpp)(source);
    if (!tree) {
        const state = luau_codegen_js_1.LuauCodeEmitter.emptyState(options.strict === true);
        return state;
    }
    const collector = new collector_js_1.ASTCollector(mapper, {
        fileName: options.relativeName || options.filePath || "input.cpp",
        sourcePath: options.filePath,
        srcDir: options.srcDir,
        outDir: options.outDir,
        strict: options.strict,
    });
    const state = collector.collect(tree.rootNode);
    const report = (0, system_understander_js_1.determineArchitecture)(options.relativeName || options.filePath || "input.cpp", null, tree.rootNode);
    for (const service of report.injectedServices) {
        state.robloxServices.add(service);
    }
    for (const line of report.reasoning) {
        state.headerLines.push(`-- ${line}`);
    }
    return state;
}
function transpileSource(source, fileName, options, mapper) {
    const state = collectState(source, mapper, options);
    if (state.strict) {
        options.strict = true;
    }
    const compiled = (0, compile_js_1.compileService)(source, fileName, options);
    return {
        ...compiled,
        files: compiled.files.map((file) => ({
            ...file,
            contents: shouldMerge(file.name, file.contents) ? luau_codegen_js_1.LuauCodeEmitter.merge(state, file.contents) : file.contents,
        })),
    };
}
function outputNameFor(inputFile, outputPath) {
    if (/\.luau$/i.test(outputPath)) {
        return outputPath;
    }
    const base = node_path_1.default.basename(inputFile).replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
    return node_path_1.default.join(outputPath, base);
}
