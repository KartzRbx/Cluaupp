"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSkipInit = shouldSkipInit;
exports.clppLuauToGame = clppLuauToGame;
const libs_js_1 = require("../libs.js");
const paths_js_1 = require("./paths.js");
function insertAfterHeader(luau, block) {
    const match = String(luau).match(/^(?:--[^\n]*\n)+/);
    if (!match) {
        return `${block}\n${luau}`;
    }
    const insertAt = match[0].length;
    const rest = luau.slice(insertAt).replace(/^\n*/, "\n");
    return `${luau.slice(0, insertAt)}\n${block}\n${rest}`;
}
const CLPP_LIB_FILE = {
    Janitor: "Sweep",
    Signal: "Spark",
    MathUtils: "Axiom",
    FormatNumber: "Mint",
    Module3D: "Stage",
    Twinkle: "Bloom",
    EzVisualz: "Bloom",
    Spring: "Coil",
    Display: "Trace",
    StickyBillboard: "Pin",
    Icon: "Crest",
    TopbarPlus: "Crest",
    Cmdr: "Helm",
    Chrono: "Echo",
    Iris: "Lens",
    Fusion: "Gleam",
    StateMachine: "Shift",
    VfxUtil: "Ember",
    DataService: "Keep",
    TutorialKit: "Guide",
    TutorialServer: "Guide",
};
function rewriteClppLibs(luau, relativeName) {
    let next = String(luau).replace(/require\(\s*ClppLibs\.([A-Za-z0-9_]+)\s*\)/g, (_all, name) => {
        return (0, libs_js_1.requireCluauppLib)(CLPP_LIB_FILE[name] || name);
    });
    next = next.replace(/CluauppLibs\.Janitor\b/g, "CluauppLibs.Sweep");
    next = next.replace(/CluauppLibs\.Signal\b/g, "CluauppLibs.Spark");
    next = next.replace(/:Add\(([^,\n()]+),\s*"Disconnect"\s*\)/g, ":Add($1)");
    const tagged = relativeName ? (0, paths_js_1.isTaggedScript)(relativeName) : false;
    const hasConnect = /:Connect\(/.test(next);
    const hasSweep = /CluauppLibs\.Sweep/.test(next) || /\bjanitor\b/.test(next) || /\bsweep\b/.test(next);
    if (tagged && hasConnect && !hasSweep) {
        next = insertAfterHeader(next, "local sweep = require(ReplicatedStorage.CluauppLibs.Sweep).new()");
    }
    return next;
}
function ensureReplicatedStorage(luau) {
    if (!luau.includes("CluauppLibs")) {
        return luau;
    }
    if (/GetService\(\s*"ReplicatedStorage"\s*\)/.test(luau)) {
        return luau;
    }
    return insertAfterHeader(luau, 'const ReplicatedStorage = game:GetService("ReplicatedStorage")');
}
function stripInitCall(luau) {
    return String(luau).replace(/\ninit\(\)\s*\n?$/m, "\n");
}
function ensureStrict(luau, strict) {
    if (!strict || /^\s*--!strict\b/m.test(luau)) {
        return luau;
    }
    if (luau.startsWith("--")) {
        return `--!strict\n${luau}`;
    }
    return `--!strict\n${luau}`;
}
function normalizeLibraryName(name) {
    const mapped = CLPP_LIB_FILE[name] || name;
    if (libs_js_1.MODULES[mapped]) {
        return mapped;
    }
    return null;
}
function librarySpecs(names) {
    const specs = [];
    const seen = new Set();
    for (const name of names || []) {
        const mapped = normalizeLibraryName(name);
        if (!mapped) {
            continue;
        }
        const spec = libs_js_1.MODULES[mapped];
        if (!spec || seen.has(spec.bind)) {
            continue;
        }
        seen.add(spec.bind);
        specs.push(spec);
    }
    return specs;
}
function includedLibraryNames(artifact, source) {
    const names = [];
    for (const name of artifact.libraries || []) {
        if (name === "*") {
            names.push(...Object.keys(libs_js_1.MODULES));
            continue;
        }
        names.push(name);
    }
    if (source) {
        names.push(...(0, libs_js_1.libraryNamesFromIncludes)(source));
    }
    return names;
}
function missingLibraries(luau, names) {
    return librarySpecs(names).filter((spec) => {
        return !luau.includes(`CluauppLibs.${spec.file}`) && !new RegExp(`\\bconst ${spec.bind}\\b`).test(luau);
    });
}
function shouldSkipInit(fileName, hasSiblingHeader) {
    if (!hasSiblingHeader) {
        return false;
    }
    return !(0, paths_js_1.isTaggedScript)(fileName);
}
function clppLuauToGame(artifact, options) {
    let luau = rewriteClppLibs(artifact.luau || "", options.relativeName);
    luau = ensureReplicatedStorage(luau);
    if (options.skipInit) {
        luau = stripInitCall(luau);
    }
    luau = ensureStrict(luau, options.strict);
    const missing = missingLibraries(luau, includedLibraryNames(artifact, options.source));
    if (missing.length > 0) {
        luau = (0, libs_js_1.insertPreamble)(luau, [], missing, options.outName);
    }
    return luau;
}
