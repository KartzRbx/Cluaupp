"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSecurity = checkSecurity;
/** Static security patterns (CLUAU-SEC*) — not a runtime anti-cheat. */
const roblox_js_1 = require("./roblox.js");
const diagnostics_js_1 = require("./diagnostics.js");
const CLIENT_PATTERNS = [
    { code: "CLUAU_SEC001", re: /\bCoins\s*=/, message: "Client appears to assign Coins — server must own currency" },
    { code: "CLUAU_SEC002", re: /\bDamage\s*=\s*[^=]/, message: "Client appears to set Damage — prefer server authority" },
    { code: "CLUAU_SEC003", re: /FireServer\s*\([^)]*Instance/, message: "Remote may accept unrestricted Instance from client" },
    { code: "CLUAU_SEC004", re: /Inventory.*=.*FireServer|FireServer.*Inventory/, message: "Client-supplied inventory result smell" },
];
const SERVER_PATTERNS = [
    { code: "CLUAU_SEC010", re: /FireServer/, message: "Server calling FireServer is inverted authority" },
    {
        code: "CLUAU_SEC011",
        re: /\.Position\b[^\n]*player|player[^\n]*\.Position/,
        message: "Server may be trusting client Position — validate or ignore client transform",
    },
];
function checkSecurity(source, fileName) {
    const ctx = (0, roblox_js_1.runContextFromFileName)(fileName);
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const out = [];
    const list = ctx === "Client" ? CLIENT_PATTERNS : ctx === "Server" ? SERVER_PATTERNS : [];
    for (const p of list) {
        const m = p.re.exec(clean);
        if (!m)
            continue;
        const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, m.index);
        out.push({
            code: p.code,
            message: p.message,
            line,
            column,
            severity: "warning",
            file: fileName,
        });
    }
    return out;
}
