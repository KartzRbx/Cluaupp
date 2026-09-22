/**
 * Apply Optimizer transforms to CL++ source:
 * - `#pragma native` on numeric-hot functions
 * - `#pragma layout soa` + SoA Luau modules when --layout
 */

import { adviseOptimizer } from "./optimizer-advise.js";
import type { CluauppProfile } from "./pgo.js";
import { rankAdvice } from "./pgo.js";
import { applyLayoutPragmas, writeSoaArtifacts, type SoaPlan } from "./optimizer-soa.js";

export interface ApplyResult {
	source: string;
	changed: boolean;
	applied: string[];
	soaPlans?: SoaPlan[];
}

export function applyOptimizerHints(
	source: string,
	fileName: string,
	profile: CluauppProfile | null = null,
	opts: { layout?: boolean; useBuffer?: boolean; projectRoot?: string } = {},
): ApplyResult {
	const advice = rankAdvice(adviseOptimizer(source, fileName), profile);
	const nativeTargets = new Set(advice.filter((a) => a.kind === "native").map((a) => a.target));
	let out = source;
	const applied: string[] = [];

	for (const name of nativeTargets) {
		const re = new RegExp(
			`((?:^|\\n)(?:\\s*))((?:void|int|float|double|bool|auto)\\s+${name}\\s*\\()`,
			"m",
		);
		const m = out.match(re);
		if (!m) continue;
		const before = out.slice(0, m.index! + m[1].length);
		if (
			/#pragma\s+native\s*$/m.test(before.slice(-80)) ||
			/#pragma\s+native/.test(out.slice(Math.max(0, m.index! - 40), m.index!))
		) {
			continue;
		}
		out = out.replace(re, `$1#pragma native\n$1$2`);
		applied.push(`#pragma native → ${name}`);
	}

	let soaPlans: SoaPlan[] | undefined;
	if (opts.layout) {
		const layout = applyLayoutPragmas(out, fileName, profile);
		out = layout.source;
		applied.push(...layout.applied);
		soaPlans = layout.plans;
		if (opts.projectRoot && layout.plans.length) {
			const files = writeSoaArtifacts(opts.projectRoot, layout.plans, { useBuffer: opts.useBuffer });
			for (const f of files) {
				applied.push(`SoA emit → ${f.replace(/\\/g, "/")}`);
			}
		}
	}

	return { source: out, changed: applied.length > 0 || out !== source, applied, soaPlans };
}
