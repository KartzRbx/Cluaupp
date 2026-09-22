"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJsonFile = loadJsonFile;
exports.readOverrideFile = readOverrideFile;
exports.overridesHash = overridesHash;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const resolver_js_1 = require("./resolver.js");
function loadJsonFile(id, filePath) {
    const absolute = node_path_1.default.isAbsolute(filePath) ? filePath : node_path_1.default.join(package_info_js_1.projectRoot, filePath);
    if (!node_fs_1.default.existsSync(absolute)) {
        throw new Error(`API source not found: ${absolute}`);
    }
    const raw = node_fs_1.default.readFileSync(absolute);
    const text = raw.toString("utf8");
    const data = JSON.parse(text);
    return {
        meta: {
            id,
            path: absolute,
            hash: (0, resolver_js_1.hashBuffer)(raw),
            loadedAt: new Date().toISOString(),
            version: typeof data.Version !== "undefined"
                ? data.Version
                : undefined,
        },
        data,
    };
}
function readOverrideFile(relativeName) {
    const filePath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "overrides", relativeName);
    if (!node_fs_1.default.existsSync(filePath)) {
        return { meta: null, data: {} };
    }
    const parsed = JSON.parse(node_fs_1.default.readFileSync(filePath, "utf8"));
    const meta = parsed._meta || null;
    const { _meta: _, ...rest } = parsed;
    return { meta, data: rest };
}
function overridesHash() {
    const dir = node_path_1.default.join(package_info_js_1.projectRoot, "api", "overrides");
    if (!node_fs_1.default.existsSync(dir)) {
        return (0, resolver_js_1.hashBuffer)("");
    }
    const parts = [];
    for (const name of node_fs_1.default.readdirSync(dir).sort()) {
        if (!name.endsWith(".json")) {
            continue;
        }
        parts.push(name, node_fs_1.default.readFileSync(node_path_1.default.join(dir, name), "utf8"));
    }
    return (0, resolver_js_1.hashBuffer)(parts.join("\n"));
}
