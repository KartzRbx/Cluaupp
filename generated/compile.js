"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSource = compileSource;
exports.compileService = compileService;
exports.compileServiceAsync = compileServiceAsync;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const runner_js_1 = require("./clpp/runner.js");
const postprocess_js_1 = require("./clpp/postprocess.js");
const paths_js_1 = require("./clpp/paths.js");
const package_info_js_1 = require("./package-info.js");
const roblox_js_1 = require("./target/roblox.js");
const capability_profile_js_1 = require("./target/capability-profile.js");
const context_check_js_1 = require("./target/context-check.js");
const datamodel_js_1 = require("./target/datamodel.js");
const datamodel_check_js_1 = require("./target/datamodel-check.js");
const datamodel_generate_js_1 = require("./target/datamodel-generate.js");
const parallel_check_js_1 = require("./target/parallel-check.js");
const authority_check_js_1 = require("./target/authority-check.js");
const get_service_js_1 = require("./target/get-service.js");
function defaultTargetProfilePath() {
    const cached = node_path_1.default.join(package_info_js_1.projectRoot, "api", "normalized", "roblox-target.profile.json");
    if (node_fs_1.default.existsSync(cached)) {
        return cached.replace(/\\/g, "/");
    }
    return undefined;
}
function ensureCapabilityProfile() {
    const file = (0, capability_profile_js_1.capabilityProfilePath)();
    if (!node_fs_1.default.existsSync(file)) {
        (0, capability_profile_js_1.writeCapabilityProfile)();
    }
    return file.replace(/\\/g, "/");
}
function resolveGameRoot(options) {
    const start = options.rootDir
        ? node_path_1.default.resolve(options.rootDir)
        : options.filePath
            ? node_path_1.default.dirname(node_path_1.default.resolve(options.filePath))
            : process.cwd();
    let dir = start;
    for (let i = 0; i < 8; i++) {
        if (node_fs_1.default.existsSync(node_path_1.default.join(dir, "default.project.json")) || node_fs_1.default.existsSync(node_path_1.default.join(dir, "default.project.jsonc"))) {
            return dir;
        }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return options.rootDir ? node_path_1.default.resolve(options.rootDir) : process.cwd();
}
function ensureDatamodel(options) {
    const root = resolveGameRoot(options);
    const written = (0, datamodel_generate_js_1.writeDatamodelArtifacts)(root);
    if (written) {
        return { profilePath: written.profilePath.replace(/\\/g, "/"), profile: written.profile };
    }
    return { profile: (0, datamodel_js_1.buildDatamodelProfile)(root) };
}
function compileArgs(source, fileName, options) {
    const relative = (options.relativeName || fileName || "input.clpp").replace(/\\/g, "/");
    const outName = options.outName || (0, paths_js_1.toLuauPath)(relative);
    const header = options.filePath ? (0, paths_js_1.siblingHeader)(options.filePath) : null;
    const skipInit = options.skipInit === true || (0, postprocess_js_1.shouldSkipInit)(relative, Boolean(header));
    const diskPath = options.filePath ? node_path_1.default.resolve(options.filePath) : null;
    const runContext = (0, roblox_js_1.runContextFromFileName)(relative);
    const dm = ensureDatamodel(options);
    const gameRoot = resolveGameRoot(options);
    return {
        request: {
            source,
            fileName: diskPath ? diskPath.replace(/\\/g, "/") : relative,
            strict: options.strict,
            optimize: options.optimize !== false,
            cwd: diskPath ? node_path_1.default.dirname(diskPath) : options.srcDir,
            targetProfilePath: defaultTargetProfilePath(),
            targetCacheDir: node_path_1.default.join(package_info_js_1.projectRoot, "api", ".cache").replace(/\\/g, "/"),
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
        policy: (0, authority_check_js_1.loadPlatformPolicy)(gameRoot),
    };
}
function enforcePlatform(source, relative, args) {
    const profile = (0, capability_profile_js_1.loadCapabilityProfile)();
    (0, context_check_js_1.assertContextSafe)(source, relative, profile);
    const warnings = (0, context_check_js_1.listContextWarnings)(source, relative, profile);
    if (warnings.length) {
        console.warn((0, context_check_js_1.formatContextViolations)(relative, warnings));
    }
    if (args.datamodel) {
        (0, datamodel_check_js_1.assertDatamodelSafe)(source, args.datamodel);
    }
    (0, parallel_check_js_1.assertParallelSafe)(source, relative);
    (0, authority_check_js_1.assertAuthoritySafe)(source, relative, args.policy);
    (0, get_service_js_1.assertGetServiceSafe)(source, relative);
}
function finishArtifact(artifact, relative, outName, options, skipInit, source) {
    const luau = (0, postprocess_js_1.clppLuauToGame)(artifact, {
        relativeName: relative,
        outName,
        srcDir: options.srcDir,
        rootDir: options.rootDir,
        strict: options.strict,
        skipInit,
        source,
        nativeHints: artifact.nativeHints,
        layoutHints: artifact.layoutHints,
    });
    return {
        kind: (0, paths_js_1.emitKind)(relative),
        plan: { kind: (0, paths_js_1.emitKind)(relative), strict: options.strict === true },
        files: [{ name: outName, contents: luau }],
        stale: [],
    };
}
function compileSource(source, fileName, options = {}) {
    return compileService(source, fileName, options).files[0]?.contents ?? "";
}
function compileService(source, fileName, options = {}) {
    const args = compileArgs(source, fileName, options);
    enforcePlatform(source, args.relative, args);
    const artifact = (0, runner_js_1.compileViaClpp)(args.request);
    return finishArtifact(artifact, args.relative, args.outName, args.options, args.skipInit, source);
}
async function compileServiceAsync(source, fileName, options = {}) {
    const args = compileArgs(source, fileName, options);
    enforcePlatform(source, args.relative, args);
    const artifact = await (0, runner_js_1.compileViaClppAsync)(args.request);
    return finishArtifact(artifact, args.relative, args.outName, args.options, args.skipInit, source);
}
