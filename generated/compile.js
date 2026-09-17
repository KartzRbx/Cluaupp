"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSource = compileSource;
exports.compileService = compileService;
const runner_js_1 = require("./clpp/runner.js");
const postprocess_js_1 = require("./clpp/postprocess.js");
const paths_js_1 = require("./clpp/paths.js");
function compileSource(source, fileName, options = {}) {
    return compileService(source, fileName, options).files[0]?.contents ?? "";
}
function compileService(source, fileName, options = {}) {
    const relative = (options.relativeName || fileName || "input.clpp").replace(/\\/g, "/");
    const outName = options.outName || (0, paths_js_1.toLuauPath)(relative);
    const header = options.filePath ? (0, paths_js_1.siblingHeader)(options.filePath) : null;
    const skipInit = options.skipInit === true || (0, postprocess_js_1.shouldSkipInit)(relative, Boolean(header));
    const artifact = (0, runner_js_1.compileViaClpp)({
        source,
        fileName: relative,
        strict: options.strict,
    });
    const luau = (0, postprocess_js_1.clppLuauToGame)(artifact, {
        relativeName: relative,
        outName,
        srcDir: options.srcDir,
        rootDir: options.rootDir,
        strict: options.strict,
        skipInit,
    });
    return {
        kind: (0, paths_js_1.emitKind)(relative),
        plan: { kind: (0, paths_js_1.emitKind)(relative), strict: options.strict === true },
        files: [{ name: outName, contents: luau }],
        stale: [],
    };
}
