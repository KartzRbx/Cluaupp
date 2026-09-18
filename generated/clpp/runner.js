"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasClpp = hasClpp;
exports.resolveClppBinary = resolveClppBinary;
exports.compileViaClpp = compileViaClpp;
exports.clppManifest = clppManifest;
exports.clppVersion = clppVersion;
exports.clppInstalls = clppInstalls;
const node_child_process_1 = require("node:child_process");
const contract_js_1 = require("./contract.js");
const MISSING_CLPP = `cluaupp: clpp not found. ${contract_js_1.CLPP_INSTALL_HINT}`;
let cachedBin;
function parseSemver(text) {
    const match = String(text).match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
        return null;
    }
    return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}
function cmpSemver(a, b) {
    return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}
function minClpp() {
    return parseSemver(contract_js_1.MIN_CLPP_VERSION) || { major: 0, minor: 2, patch: 6 };
}
function tooOldMessage(bin, version) {
    return `cluaupp: clpp ${version || "unknown"} is too old (${bin}). Need CL++ ${contract_js_1.MIN_CLPP_VERSION}+ (for-in, GetService<T>, #pragma). cargo 0.1.0 cannot parse current CL++. Install https://github.com/KartzRbx/CLPP/releases or set CLPP_PATH to the newer binary.`;
}
function probeVersion(bin) {
    const result = (0, node_child_process_1.spawnSync)(bin, ["--version"], { encoding: "utf8", windowsHide: true });
    if (result.status !== 0) {
        return null;
    }
    return String(result.stdout || result.stderr || "").trim() || null;
}
function listClppCandidates() {
    if (process.env.CLPP_PATH) {
        return [process.env.CLPP_PATH];
    }
    const finder = process.platform === "win32" ? "where" : "which";
    const found = (0, node_child_process_1.spawnSync)(finder, ["clpp"], { encoding: "utf8", windowsHide: true });
    if (found.status !== 0) {
        return [];
    }
    const seen = new Set();
    const out = [];
    for (const line of String(found.stdout || "").split(/\r?\n/)) {
        const item = line.trim();
        if (!item || seen.has(item.toLowerCase())) {
            continue;
        }
        seen.add(item.toLowerCase());
        out.push(item);
    }
    return out;
}
function pickClppBinary() {
    const candidates = listClppCandidates();
    if (candidates.length === 0) {
        return null;
    }
    let best = null;
    let fallback = null;
    for (const bin of candidates) {
        const version = probeVersion(bin);
        const parsed = parseSemver(version || "");
        if (!fallback) {
            fallback = bin;
        }
        if (!parsed) {
            continue;
        }
        if (!best || cmpSemver(parsed, best.parsed) > 0) {
            best = { bin, parsed };
        }
    }
    return best?.bin || fallback;
}
function whichClpp() {
    if (cachedBin !== undefined) {
        return cachedBin;
    }
    cachedBin = pickClppBinary();
    return cachedBin;
}
function hasClpp() {
    return Boolean(whichClpp());
}
function resolveClppBinary() {
    const bin = whichClpp();
    if (!bin) {
        throw new Error(MISSING_CLPP);
    }
    const version = probeVersion(bin);
    const parsed = parseSemver(version || "");
    if (!parsed || cmpSemver(parsed, minClpp()) < 0) {
        throw new Error(tooOldMessage(bin, version));
    }
    return bin;
}
function parseArtifact(stdout, fileName, fallbackError) {
    const text = String(stdout || "").trim();
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    }
    catch {
        // fall through
    }
    return {
        ok: false,
        luau: "",
        fileName,
        outputHint: "",
        scriptKind: null,
        isScript: false,
        isHeader: false,
        rojoClass: "ModuleScript",
        libraries: [],
        error: fallbackError || "clpp returned invalid JSON",
    };
}
function compileViaClpp(request) {
    const bin = resolveClppBinary();
    const payload = JSON.stringify({
        source: request.source,
        fileName: request.fileName,
        strict: request.strict,
    });
    const result = (0, node_child_process_1.spawnSync)(bin, ["api", "compile"], {
        input: payload,
        encoding: "utf8",
        cwd: request.cwd,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
    });
    const stderr = String(result.stderr || "").trim();
    const artifact = parseArtifact(result.stdout, request.fileName, stderr || result.error?.message || "clpp api compile failed");
    if (!artifact.ok) {
        throw new Error(artifact.error || stderr || `clpp failed (${result.status})`);
    }
    return artifact;
}
function clppManifest() {
    const bin = resolveClppBinary();
    const result = (0, node_child_process_1.spawnSync)(bin, ["api", "manifest"], {
        encoding: "utf8",
        windowsHide: true,
    });
    if (result.status !== 0) {
        throw new Error(String(result.stderr || result.error?.message || "clpp api manifest failed"));
    }
    return JSON.parse(result.stdout);
}
function clppVersion() {
    const bin = whichClpp();
    if (!bin) {
        return null;
    }
    return probeVersion(bin);
}
function clppInstalls() {
    const selected = whichClpp();
    return listClppCandidates().map((bin) => ({
        bin,
        version: probeVersion(bin),
        selected: bin === selected,
    }));
}
