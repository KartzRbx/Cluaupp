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
function rewriteClppLibs(luau) {
    return String(luau).replace(/require\(\s*ClppLibs\.([A-Za-z0-9_]+)\s*\)/g, (_all, name) => {
        return (0, libs_js_1.requireCluauppLib)(name);
    });
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
function librarySpecs(names) {
    const specs = [];
    const seen = new Set();
    for (const name of names || []) {
        const spec = libs_js_1.MODULES[name];
        if (!spec || seen.has(spec.bind)) {
            continue;
        }
        seen.add(spec.bind);
        specs.push(spec);
    }
    return specs;
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
    let luau = rewriteClppLibs(artifact.luau || "");
    luau = ensureReplicatedStorage(luau);
    if (options.skipInit) {
        luau = stripInitCall(luau);
    }
    luau = ensureStrict(luau, options.strict);
    const missing = missingLibraries(luau, artifact.libraries);
    if (missing.length > 0) {
        luau = (0, libs_js_1.insertPreamble)(luau, [], missing, options.outName);
    }
    return luau;
}
