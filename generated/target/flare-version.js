"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFlareVersions = checkFlareVersions;
/** Flare remote versioning — detect schema version drift across .flare files. */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const index_js_1 = require("../flare/index.js");
function readVersion(source, parsedVersion) {
    if (typeof parsedVersion === "number" && Number.isFinite(parsedVersion)) {
        return parsedVersion;
    }
    const m = source.match(/^\s*version\s+(\d+)\s*;?/m) ||
        source.match(/^\s*opt\s+version\s*=\s*(\d+)/im) ||
        source.match(/^\s*#\s*version\s+(\d+)/m);
    return m ? Number(m[1]) : null;
}
function checkFlareVersions(projectRoot, rootDir = "src") {
    const srcDir = node_path_1.default.join(projectRoot, rootDir);
    const files = node_fs_1.default.existsSync(srcDir) ? (0, index_js_1.collectFlareFiles)(srcDir) : [];
    const byName = new Map();
    const listed = [];
    for (const file of files) {
        const source = node_fs_1.default.readFileSync(file, "utf8");
        const rel = node_path_1.default.relative(projectRoot, file).replace(/\\/g, "/");
        let name = node_path_1.default.basename(file, ".flare");
        let parsedVersion;
        try {
            const parsed = (0, index_js_1.parseFlare)(source, rel, name);
            name = parsed.name || name;
            parsedVersion = parsed.version;
        }
        catch {
            /* parse may fail on partial */
        }
        const version = readVersion(source, parsedVersion);
        listed.push({ file: rel, name, version });
        if (!byName.has(name))
            byName.set(name, []);
        byName.get(name).push({ file: rel, version });
    }
    const conflicts = [];
    for (const [name, entries] of byName) {
        const versions = new Set(entries.map((e) => e.version).filter((v) => v !== null));
        if (versions.size > 1) {
            conflicts.push({
                code: "CLUAU_NET_VERSION",
                message: `Flare contract "${name}" has conflicting versions: ${[...versions].join(", ")} across ${entries.map((e) => e.file).join(", ")}`,
                line: 1,
                column: 1,
                severity: "error",
            });
        }
    }
    return { files: listed, conflicts };
}
