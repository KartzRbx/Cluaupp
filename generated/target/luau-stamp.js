"use strict";
/**
 * Stamp emitted Luau with CL++ provenance and --!native when source used #pragma native.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stampLuauFromClpp = stampLuauFromClpp;
function stampLuauFromClpp(luau, sourceRel, clppSource) {
    let next = String(luau);
    const stamp = `-- cluaupp-source: ${sourceRel.replace(/\\/g, "/")}`;
    if (!next.includes("cluaupp-source:")) {
        if (/^--!/.test(next.trimStart())) {
            const lines = next.split(/\r?\n/);
            let i = 0;
            while (i < lines.length && /^--!/.test(lines[i]))
                i++;
            lines.splice(i, 0, stamp);
            next = lines.join("\n");
        }
        else if (next.startsWith("--")) {
            next = `${stamp}\n${next}`;
        }
        else {
            next = `${stamp}\n${next}`;
        }
    }
    const wantsNative = Boolean(clppSource && /#pragma\s+native\b/.test(clppSource));
    if (wantsNative && !/--!native\b/.test(next)) {
        if (/^\s*--!strict\b/m.test(next)) {
            next = next.replace(/^\s*--!strict\b/m, "--!native\n--!strict");
        }
        else if (/^\s*--!optimize\b/m.test(next)) {
            next = `--!native\n${next}`;
        }
        else {
            next = `--!native\n${next}`;
        }
    }
    return next;
}
