/**
 * Cluaupp Optimizer advisor (v1) — suggestions only; does not rewrite Luau yet.
 * Philosophy: write idiomatic CL++; compiler advises best representation.
 */

import { type PlatformDiagnostic, lineColAt, stripCommentsKeepStrings } from "./diagnostics.js";

export interface OptimizeAdvice {
	kind: "storage" | "native" | "parallel" | "layout";
	target: string;
	message: string;
	severity: "info" | "warning";
}

export function adviseOptimizer(source: string, fileName: string): OptimizeAdvice[] {
	const clean = stripCommentsKeepStrings(source);
	const advice: OptimizeAdvice[] = [];

	const structRe = /struct\s+([A-Za-z_]\w*)\s*\{([^}]*)\}/g;
	let m: RegExpExecArray | null;
	while ((m = structRe.exec(clean))) {
		const name = m[1];
		const body = m[2];
		const fields = body.split(";").map((s) => s.trim()).filter(Boolean);
		if (fields.length < 2) continue;
		const numeric = fields.filter((f) => /^(float|double|int|i32|f32|f64|bool)\b/.test(f) || /\bVector3\b/.test(f));
		const ratio = numeric.length / fields.length;
		if (ratio >= 0.75 && fields.length >= 3) {
			advice.push({
				kind: "storage",
				target: name,
				message: `Hot numeric struct ${name} (${numeric.length}/${fields.length} fields) — candidate for SoA / dense storage (Optimizer Level 1–3)`,
				severity: "info",
			});
		}
		const bools = fields.filter((f) => /^bool\b/.test(f));
		if (bools.length >= 4) {
			advice.push({
				kind: "layout",
				target: name,
				message: `${name} has ${bools.length} bool fields — candidate for internal bitset packing`,
				severity: "info",
			});
		}
	}

	const fnRe = /(?:void|int|float|double|bool|auto)\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
	while ((m = fnRe.exec(clean))) {
		const name = m[1];
		if (name === "init") continue;
		const start = m.index + m[0].length;
		let depth = 1;
		let i = start;
		for (; i < clean.length && depth > 0; i++) {
			if (clean[i] === "{") depth++;
			else if (clean[i] === "}") depth--;
		}
		const body = clean.slice(start, i);
		const apiHits = (body.match(/GetService|WaitForChild|Instance|FindFirstChild|FireServer|FireClient/g) || []).length;
		const numericHits = (body.match(/\b(sin|cos|sqrt|Vector3|CFrame|math::)\b|[+\-*/]=|[+\-*/]/g) || []).length;
		if (numericHits >= 6 && apiHits <= 1 && body.length > 40) {
			advice.push({
				kind: "native",
				target: name,
				message: `${name} looks numeric-hot / low Instance API — good @native / --!native candidate (CLUAU-PERF-001)`,
				severity: "info",
			});
		}
		if (apiHits === 0 && /for\s*\(/.test(body) && !/shared|static/.test(body)) {
			advice.push({
				kind: "parallel",
				target: name,
				message: `${name} may be parallelizable (independent loop, no shared Instance API) — review ThreadSafety`,
				severity: "info",
			});
		}
	}

	void fileName;
	void lineColAt;
	return advice;
}

export function adviceAsDiagnostics(advice: OptimizeAdvice[], fileName: string): PlatformDiagnostic[] {
	return advice.map((a) => ({
		code: a.kind === "native" ? "CLUAU_PERF001" : a.kind === "parallel" ? "CLUAU_PAR_ADVISE" : "CLUAU_OPT001",
		message: a.message,
		line: 1,
		column: 1,
		severity: a.severity === "warning" ? "warning" : "info",
		file: fileName,
	}));
}
