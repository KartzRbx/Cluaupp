"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReleaseChecklist = buildReleaseChecklist;
exports.writeApiChangelog = writeApiChangelog;
/** Release / checksum helpers for Roblox Target artifacts. */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const package_info_js_2 = require("../package-info.js");
const resolver_js_1 = require("./resolver.js");
const model_js_1 = require("./model.js");
function buildReleaseChecklist() {
    const lockPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "roblox-api.lock.json");
    const manifestPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "manifests", "roblox-target.manifest.json");
    const checksums = {};
    for (const rel of [
        "include/clpp/generated/enums.clh",
        "include/clpp/datatypes.clh",
        "include/clpp/generated/instances.clh",
        "api/overrides/datatypes.json",
    ]) {
        const full = node_path_1.default.join(package_info_js_1.projectRoot, rel);
        if (node_fs_1.default.existsSync(full)) {
            checksums[rel] = (0, resolver_js_1.hashBuffer)(node_fs_1.default.readFileSync(full));
        }
    }
    return {
        schemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        generatorVersion: package_info_js_2.pkg.version,
        lockPresent: node_fs_1.default.existsSync(lockPath),
        manifestPresent: node_fs_1.default.existsSync(manifestPath),
        checksums,
    };
}
function writeApiChangelog(entries, outPath) {
    const target = outPath || node_path_1.default.join(package_info_js_1.projectRoot, "api", "CHANGELOG.md");
    const body = [`# Roblox API changelog`, ``, ...entries.map((e) => `- ${e}`), ``].join("\n");
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(target), { recursive: true });
    node_fs_1.default.writeFileSync(target, body, "utf8");
    return target;
}
