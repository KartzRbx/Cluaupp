"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLifetime = checkLifetime;
/** Lifetime / leak heuristics (CLUAU-LIFE*). */
const diagnostics_js_1 = require("./diagnostics.js");
function checkLifetime(source, fileName) {
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const out = [];
    const connectRe = /\.Connect\s*\(/g;
    let m;
    while ((m = connectRe.exec(clean))) {
        const before = clean.slice(Math.max(0, m.index - 8), m.index);
        if (before.includes("~>") || before.endsWith("::")) {
            continue;
        }
        const window = clean.slice(Math.max(0, m.index - 120), m.index + 80);
        if (window.includes("janitor") || window.includes("Sweep") || /\.Add\s*\(/.test(window)) {
            continue;
        }
        const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, m.index);
        out.push({
            code: "CLUAU_LIFE001",
            message: "Connection created without Sweep/`~>` / janitor.Add nearby — possible leak",
            line,
            column,
            severity: "warning",
            file: fileName,
        });
    }
    const spawnRe = /\bspawn\s*\{/g;
    while ((m = spawnRe.exec(clean))) {
        const bodyEnd = clean.indexOf("}", m.index);
        const body = clean.slice(m.index, bodyEnd > 0 ? bodyEnd : m.index + 200);
        if (!/cancel|Cleanup|Destroy|return/.test(body) && /while\s*\(|for\s*\(/.test(body)) {
            const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, m.index);
            out.push({
                code: "CLUAU_LIFE002",
                message: "spawn { } with a loop and no obvious cancellation path",
                line,
                column,
                severity: "info",
                file: fileName,
            });
        }
    }
    return out;
}
