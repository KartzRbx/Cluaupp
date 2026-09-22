"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCacheKey = computeCacheKey;
exports.cacheDir = cacheDir;
exports.readCache = readCache;
exports.writeCache = writeCache;
exports.cacheKeyHash = cacheKeyHash;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const package_info_js_1 = require("../package-info.js");
const resolver_js_1 = require("../api/resolver.js");
const loader_js_1 = require("../api/loader.js");
const build_profile_js_1 = require("../api/build-profile.js");
function computeCacheKey(generatorVersion, dumpPath) {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ dumpPath, skipValidate: true });
    return {
        sourceHash: profile.sources["mini-api-dump"]?.hash || (0, build_profile_js_1.profileContentHash)(profile),
        overridesHash: (0, loader_js_1.overridesHash)(),
        generatorVersion,
    };
}
function cacheDir() {
    return node_path_1.default.join(package_info_js_1.projectRoot, "api", ".cache");
}
function readCache(key) {
    const file = node_path_1.default.join(cacheDir(), `${key}.json`);
    if (!node_fs_1.default.existsSync(file)) {
        return null;
    }
    return JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
}
function writeCache(key, value) {
    node_fs_1.default.mkdirSync(cacheDir(), { recursive: true });
    const file = node_path_1.default.join(cacheDir(), `${key}.json`);
    const tmp = `${file}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, `${JSON.stringify(value)}\n`, "utf8");
    node_fs_1.default.renameSync(tmp, file);
}
function cacheKeyHash(parts) {
    return (0, resolver_js_1.hashBuffer)(`${parts.sourceHash}:${parts.overridesHash}:${parts.generatorVersion}`);
}
