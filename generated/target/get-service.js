"use strict";
/**
 * GetService\<T\>() — Cluaupp host feature (Roblox Target), not a CL++ language primitive.
 *
 * CL++ parses `GetService<Players>()` as a normal generic call and may emit
 * `game:GetService("Players")`. Cluaupp owns:
 * - which names are services (Canonical Registry)
 * - IntelliSense stubs (`#include <clpp/roblox.clh>`)
 * - Context Safety / capability rules for services
 * - unknown-service diagnostics at build time
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectGetServiceUses = collectGetServiceUses;
exports.checkGetService = checkGetService;
exports.assertGetServiceSafe = assertGetServiceSafe;
exports.rewriteGetServiceLuau = rewriteGetServiceLuau;
const build_profile_js_1 = require("../api/build-profile.js");
const diagnostics_js_1 = require("./diagnostics.js");
const roblox_js_1 = require("./roblox.js");
const GET_SERVICE_CALL = /\bGetService\s*(?:<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)|\(\s*["']([A-Za-z_]\w*)["']\s*\))/g;
/** Extract GetService\<T\>() / GetService("T") uses from CL++ source. */
function collectGetServiceUses(source) {
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const out = [];
    GET_SERVICE_CALL.lastIndex = 0;
    let m;
    while ((m = GET_SERVICE_CALL.exec(clean))) {
        const service = m[1] || m[2];
        if (!service)
            continue;
        out.push({ service, index: m.index, generic: Boolean(m[1]) });
    }
    return out;
}
function checkGetService(source, fileName, profile) {
    const p = profile || (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const out = [];
    for (const use of collectGetServiceUses(source)) {
        if ((0, roblox_js_1.resolveGetServiceType)(use.service, p)) {
            continue;
        }
        const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, use.index);
        out.push({
            message: `CLUAU_SVC001: unknown service \`${use.service}\` for GetService (Cluaupp registry)`,
            line,
            column,
            severity: "error",
        });
    }
    return out;
}
function assertGetServiceSafe(source, fileName, profile) {
    const diags = checkGetService(source, fileName, profile);
    if (diags.length === 0) {
        return;
    }
    const body = diags.map((d) => `  ${fileName}:${d.line}:${d.column}: ${d.message}`).join("\n");
    throw new Error(`cluaupp: GetService check failed\n${body}`);
}
/**
 * Normalize free-standing GetService leftovers in Luau to game:GetService("Name").
 * Prefer CL++ emit; this is a host safety net for host-owned semantics.
 */
function rewriteGetServiceLuau(luau) {
    return String(luau)
        .replace(/\bGetService\s*<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)/g, 'game:GetService("$1")')
        .replace(/\bGetService\s*\(\s*["']([A-Za-z_]\w*)["']\s*\)/g, 'game:GetService("$1")');
}
