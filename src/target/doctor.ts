/**
 * cluaupp doctor — run all platform checks and report.
 */

import fs from "node:fs";
import path from "node:path";
import { collectSources } from "../clpp/paths.js";
import { buildRobloxTargetProfile, profileContentHash } from "../api/build-profile.js";
import { projectRoot as pkgRoot } from "../package-info.js";
import { overridesHash } from "../api/loader.js";
import { writeCapabilityProfile } from "./capability-profile.js";
import { builtinCapabilityProfile } from "./capabilities.js";
import { checkContextSafety } from "./context-check.js";
import { writeDatamodelArtifacts } from "./datamodel-generate.js";
import { checkDatamodelPaths } from "./datamodel-check.js";
import { checkParallelSafety } from "./parallel-check.js";
import { checkAuthority, loadPlatformPolicy } from "./authority-check.js";
import { checkAuthorityGraph } from "./authority-graph.js";
import { checkComponentContracts } from "./component-contracts.js";
import { checkSecurity } from "./security-check.js";
import { checkLifetime } from "./lifetime-check.js";
import { adviseOptimizer, adviceAsDiagnostics } from "./optimizer-advise.js";
import { buildProjectGraph } from "./project-graph.js";
import { checkFlareVersions } from "./flare-version.js";
import type { PlatformDiagnostic } from "./diagnostics.js";

export interface DoctorReport {
	ok: boolean;
	checks: Array<{ name: string; ok: boolean; detail?: string; diagnostics?: PlatformDiagnostic[] }>;
	outOfScope: string[];
}

function verifyLockLocal(): { ok: boolean; messages: string[] } {
	const lockPath = path.join(pkgRoot, "api", "roblox-api.lock.json");
	if (!fs.existsSync(lockPath)) {
		return { ok: false, messages: ["missing api/roblox-api.lock.json"] };
	}
	try {
		const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as { profileHash?: string; overridesHash?: string };
		const profile = buildRobloxTargetProfile({ skipValidate: true });
		const messages: string[] = [];
		const ph = profileContentHash(profile);
		if (lock.profileHash && lock.profileHash !== ph) {
			messages.push("profile hash drift — run cluaupp api generate");
		}
		if (lock.overridesHash && lock.overridesHash !== overridesHash()) {
			messages.push("overrides hash drift — run cluaupp api generate");
		}
		return { ok: messages.length === 0, messages };
	} catch (err) {
		return { ok: false, messages: [err instanceof Error ? err.message : String(err)] };
	}
}

export function runDoctor(gameRoot: string, rootDir = "src"): DoctorReport {
	const checks: DoctorReport["checks"] = [];
	const srcDir = path.join(gameRoot, rootDir);
	const files = fs.existsSync(srcDir) ? collectSources(srcDir) : [];
	const policy = loadPlatformPolicy(gameRoot);

	try {
		buildRobloxTargetProfile({ skipValidate: true });
		checks.push({ name: "api-registry", ok: true });
	} catch (err) {
		checks.push({ name: "api-registry", ok: false, detail: err instanceof Error ? err.message : String(err) });
	}

	const lock =
		path.resolve(gameRoot) === path.resolve(pkgRoot) ? verifyLockLocal() : { ok: true, messages: ["skipped (not Cluaupp package root)"] };
	checks.push({ name: "api-lock", ok: lock.ok, detail: lock.ok ? lock.messages[0] : lock.messages.join("; ") });

	writeCapabilityProfile();
	checks.push({ name: "context-profile", ok: true, detail: `${builtinCapabilityProfile().rules.length} rules` });

	const dm = writeDatamodelArtifacts(gameRoot);
	checks.push({
		name: "datamodel",
		ok: Boolean(dm),
		detail: dm ? `${Object.keys(dm.profile.byPath).length} nodes` : "no default.project.json",
	});

	const allDiags: PlatformDiagnostic[] = [];
	for (const file of files) {
		const rel = path.relative(gameRoot, file).replace(/\\/g, "/");
		const source = fs.readFileSync(file, "utf8");
		allDiags.push(
			...checkContextSafety(source, rel).map((d) => ({
				code: d.code,
				message: d.message,
				line: d.line,
				column: d.column,
				severity: d.severity as PlatformDiagnostic["severity"],
				file: rel,
			})),
		);
		allDiags.push(...checkParallelSafety(source, rel));
		allDiags.push(...checkAuthority(source, rel, policy));
		allDiags.push(...checkSecurity(source, rel));
		allDiags.push(...checkLifetime(source, rel));
		allDiags.push(...adviceAsDiagnostics(adviseOptimizer(source, rel), rel));
		if (dm) {
			allDiags.push(
				...checkDatamodelPaths(source, dm.profile).map((d) => ({
					code: d.code,
					message: d.message,
					line: d.line,
					column: d.column,
					severity: d.severity as PlatformDiagnostic["severity"],
					file: rel,
				})),
			);
		}
	}

	if (dm && policy.components?.length) {
		allDiags.push(...checkComponentContracts(dm.profile, policy.components));
	}

	const flare = checkFlareVersions(gameRoot, rootDir);
	allDiags.push(...flare.conflicts);
	allDiags.push(...checkAuthorityGraph(gameRoot, rootDir, policy));

	const graph = buildProjectGraph(gameRoot, rootDir);
	if (graph.cycles.length) {
		allDiags.push({
			code: "CLUAU_GRAPH_CYCLE",
			message: `Circular includes: ${graph.cycles.map((c) => c.join(" → ")).join(" | ")}`,
			line: 1,
			column: 1,
			severity: "error",
		});
	}

	const errors = allDiags.filter((d) => d.severity === "error");
	const warnings = allDiags.filter((d) => d.severity === "warning");
	checks.push({
		name: "source-analysis",
		ok: errors.length === 0,
		detail: `${files.length} files, ${errors.length} errors, ${warnings.length} warnings, ${allDiags.filter((d) => d.severity === "info").length} info`,
		diagnostics: allDiags.slice(0, 50),
	});
	checks.push({
		name: "project-graph",
		ok: graph.cycles.length === 0,
		detail: `${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.cycles.length} cycles`,
	});
	checks.push({
		name: "flare-versions",
		ok: flare.conflicts.length === 0,
		detail: `${flare.files.length} schemas`,
	});

	return {
		ok: checks.every((c) => c.ok),
		checks,
		outOfScope: [
			"Roblox bytecode / custom VM debugger (Studio ScriptContext + maps + CluauppNav cover source-level)",
		],
	};
}
