"use strict";
/**
 * Parallel Luau / ThreadSafety diagnostics (CLUAU-PAR*).
 * Flags Unsafe mutations inside parallel { } / desynchronize regions.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkParallelSafety = checkParallelSafety;
exports.assertParallelSafe = assertParallelSafe;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const diagnostics_js_1 = require("./diagnostics.js");
let cachedUnsafeMembers = null;
function loadUnsafeMemberNames() {
    if (cachedUnsafeMembers) {
        return cachedUnsafeMembers;
    }
    const set = new Set(["Parent", "Name"]); // Parent writes always unsafe in parallel
    const profilePath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "normalized", "roblox-target.profile.json");
    if (node_fs_1.default.existsSync(profilePath)) {
        try {
            const profile = JSON.parse(node_fs_1.default.readFileSync(profilePath, "utf8"));
            for (const cls of Object.values(profile.classes || {})) {
                for (const prop of Object.values(cls.properties || {})) {
                    if (prop.threadSafety === "Unsafe") {
                        set.add(prop.name);
                    }
                }
                for (const method of Object.values(cls.methods || {})) {
                    if (method.threadSafety === "Unsafe") {
                        set.add(method.name);
                    }
                }
            }
        }
        catch {
            /* fallback set only */
        }
    }
    cachedUnsafeMembers = set;
    return set;
}
function extractParallelRegions(source) {
    const regions = [];
    const reParallel = /\bparallel\s*\{/g;
    let m;
    while ((m = reParallel.exec(source))) {
        const open = m.index + m[0].length - 1;
        let depth = 0;
        for (let i = open; i < source.length; i++) {
            if (source[i] === "{")
                depth++;
            else if (source[i] === "}") {
                depth--;
                if (depth === 0) {
                    regions.push({ start: m.index, body: source.slice(open + 1, i) });
                    break;
                }
            }
        }
    }
    const reDesync = /task\s*::\s*desynchronize\s*\(\s*\)/g;
    while ((m = reDesync.exec(source))) {
        const rest = source.slice(m.index);
        const sync = rest.search(/task\s*::\s*synchronize\s*\(\s*\)/);
        const body = sync >= 0 ? rest.slice(0, sync) : rest.slice(0, Math.min(rest.length, 800));
        regions.push({ start: m.index, body });
    }
    if (/\bConnectParallel\b/.test(source)) {
        regions.push({ start: source.indexOf("ConnectParallel"), body: source });
    }
    return regions;
}
function checkParallelSafety(source, fileName = "input.clpp") {
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const unsafe = loadUnsafeMemberNames();
    const out = [];
    const regions = extractParallelRegions(clean);
    if (!regions.length) {
        return out;
    }
    for (const region of regions) {
        const parentAssign = /\.Parent\s*=/g;
        let pm;
        while ((pm = parentAssign.exec(region.body))) {
            const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, region.start + pm.index);
            out.push({
                code: "CLUAU_PAR001",
                message: "Unsafe Instance write `.Parent =` inside parallel / desynchronized region",
                line,
                column,
                severity: "error",
                file: fileName,
            });
        }
        const memberWrite = /\.([A-Za-z_]\w*)\s*=/g;
        while ((pm = memberWrite.exec(region.body))) {
            const name = pm[1];
            if (name === "Parent")
                continue;
            if (!unsafe.has(name))
                continue;
            const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, region.start + pm.index);
            out.push({
                code: "CLUAU_PAR002",
                message: `API member \`.${name}\` is ThreadSafety=Unsafe inside parallel region`,
                line,
                column,
                severity: "error",
                file: fileName,
            });
        }
        const destroy = /\.Destroy\s*\(/g;
        while ((pm = destroy.exec(region.body))) {
            const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, region.start + pm.index);
            out.push({
                code: "CLUAU_PAR003",
                message: "`Destroy()` is Unsafe inside parallel region",
                line,
                column,
                severity: "error",
                file: fileName,
            });
        }
    }
    return out;
}
function assertParallelSafe(source, fileName) {
    const errors = checkParallelSafety(source, fileName).filter((d) => d.severity === "error");
    if (!errors.length)
        return;
    throw new Error(`Parallel safety:\n${errors.map((e) => `  ${e.line}:${e.column} ${e.code} ${e.message}`).join("\n")}`);
}
