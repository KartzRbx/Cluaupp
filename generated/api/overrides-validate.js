"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOverrides = validateOverrides;
exports.diffOverrideFiles = diffOverrideFiles;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
/** Validate override JSON files carry audit metadata. */
function validateOverrides() {
    const dir = node_path_1.default.join(package_info_js_1.projectRoot, "api", "overrides");
    const issues = [];
    if (!node_fs_1.default.existsSync(dir)) {
        return [{ file: "api/overrides", message: "overrides directory missing" }];
    }
    for (const name of node_fs_1.default.readdirSync(dir).sort()) {
        if (!name.endsWith(".json")) {
            continue;
        }
        const full = node_path_1.default.join(dir, name);
        const parsed = JSON.parse(node_fs_1.default.readFileSync(full, "utf8"));
        if (!parsed._meta) {
            issues.push({ file: name, message: "missing _meta" });
            continue;
        }
        for (const key of ["reason", "source", "introducedAt"]) {
            if (!parsed._meta[key]) {
                issues.push({ file: name, message: `missing _meta.${key}` });
            }
        }
    }
    return issues;
}
function diffOverrideFiles(beforeDir, afterDir) {
    const before = new Set(node_fs_1.default.existsSync(beforeDir) ? node_fs_1.default.readdirSync(beforeDir).filter((f) => f.endsWith(".json")) : []);
    const after = new Set(node_fs_1.default.existsSync(afterDir) ? node_fs_1.default.readdirSync(afterDir).filter((f) => f.endsWith(".json")) : []);
    const changes = [];
    for (const f of after) {
        if (!before.has(f)) {
            changes.push(`ADDED ${f}`);
        }
        else {
            const a = node_fs_1.default.readFileSync(node_path_1.default.join(beforeDir, f), "utf8");
            const b = node_fs_1.default.readFileSync(node_path_1.default.join(afterDir, f), "utf8");
            if (a !== b) {
                changes.push(`CHANGED ${f}`);
            }
        }
    }
    for (const f of before) {
        if (!after.has(f)) {
            changes.push(`REMOVED ${f}`);
        }
    }
    return changes;
}
