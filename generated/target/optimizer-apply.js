"use strict";
/**
 * Apply Optimizer transforms to CL++ source:
 * - `#pragma native` on numeric-hot functions
 * - `#pragma layout soa` + SoA Luau modules when --layout
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyOptimizerHints = applyOptimizerHints;
const optimizer_advise_js_1 = require("./optimizer-advise.js");
const pgo_js_1 = require("./pgo.js");
const optimizer_soa_js_1 = require("./optimizer-soa.js");
function applyOptimizerHints(source, fileName, profile = null, opts = {}) {
    const advice = (0, pgo_js_1.rankAdvice)((0, optimizer_advise_js_1.adviseOptimizer)(source, fileName), profile);
    const nativeTargets = new Set(advice.filter((a) => a.kind === "native").map((a) => a.target));
    let out = source;
    const applied = [];
    for (const name of nativeTargets) {
        const re = new RegExp(`((?:^|\\n)(?:\\s*))((?:void|int|float|double|bool|auto)\\s+${name}\\s*\\()`, "m");
        const m = out.match(re);
        if (!m)
            continue;
        const before = out.slice(0, m.index + m[1].length);
        if (/#pragma\s+native\s*$/m.test(before.slice(-80)) ||
            /#pragma\s+native/.test(out.slice(Math.max(0, m.index - 40), m.index))) {
            continue;
        }
        out = out.replace(re, `$1#pragma native\n$1$2`);
        applied.push(`#pragma native → ${name}`);
    }
    let soaPlans;
    if (opts.layout) {
        const layout = (0, optimizer_soa_js_1.applyLayoutPragmas)(out, fileName, profile);
        out = layout.source;
        applied.push(...layout.applied);
        soaPlans = layout.plans;
        if (opts.projectRoot && layout.plans.length) {
            const files = (0, optimizer_soa_js_1.writeSoaArtifacts)(opts.projectRoot, layout.plans, { useBuffer: opts.useBuffer });
            for (const f of files) {
                applied.push(`SoA emit → ${f.replace(/\\/g, "/")}`);
            }
        }
    }
    return { source: out, changed: applied.length > 0 || out !== source, applied, soaPlans };
}
