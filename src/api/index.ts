import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import { pkg } from "../package-info.js";
import { buildRobloxTargetProfile, profileContentHash, writeProfileCache } from "./build-profile.js";
import { computeCoverage } from "./coverage.js";
import { diffProfiles } from "./diff.js";
import { generateClppHeaders } from "./generators/clpp-headers.js";
import { generateLuauDefs, tryLuauAnalyze } from "./generators/luau-defs.js";
import { generateReferenceDocs } from "./generators/docs-reference.js";
import { writeLspIndex } from "./generators/lsp-index.js";
import { writeCapabilityProfile } from "../target/capability-profile.js";
import { overridesHash } from "./loader.js";
import type { RobloxTargetProfile } from "./model.js";
import { ROBLOX_TARGET_SCHEMA_VERSION } from "./model.js";
import { buildRegistry, searchRegistry } from "./registry.js";
import { hashBuffer } from "./resolver.js";
import { validateProfile } from "./validate.js";

export * from "./model.js";
export * from "./resolver.js";
export * from "./identifier.js";
export * from "./registry.js";
export * from "./diff.js";
export * from "./coverage.js";
export { buildRobloxTargetProfile, writeProfileCache, profileContentHash } from "./build-profile.js";
export { generateClppHeaders } from "./generators/clpp-headers.js";
export { generateLuauDefs } from "./generators/luau-defs.js";
export { generateReferenceDocs } from "./generators/docs-reference.js";
export { buildLspIndex, writeLspIndex, LSP_INDEX_SCHEMA_VERSION } from "./generators/lsp-index.js";
export { loadMiniDump } from "./sources/mini-dump.js";
export { loadStudioApi } from "./sources/studio-api.js";
export { loadStudioFullApi } from "./sources/studio-full-api.js";
export { loadStudioApiV2 } from "./sources/studio-apiv2.js";
export { loadLuauTypes } from "./sources/luau-types.js";
export { loadCreatorDocs } from "./sources/creator-docs.js";
export { loadClientTrackerDump } from "./sources/client-tracker.js";
export { diffAgainstAuxTypes } from "./sources/aux-types-diff.js";
export { escapeIdent, escapeMember, isReserved } from "./identifier.js";
export {
	listMembers,
	describeSymbol,
	similarSymbols,
	completeMember,
	hoverSymbol,
	suggestDidYouMean,
	getApiRegistry,
} from "./ide.js";
export { runStudioSmoke, RUNTIME_SUITE } from "./studio-smoke.js";
export { matchIntents, understandSymbol, INTENT_RULES } from "./understander.js";
export { computeCacheKey, cacheKeyHash, readCache, writeCache } from "./cache.js";
export { resolveGetServiceType, runContextFromFileName, defaultRobloxProject, isRegisteredService } from "../target/roblox.js";
export { checkGetService, assertGetServiceSafe, collectGetServiceUses, rewriteGetServiceLuau } from "../target/get-service.js";
export { builtinCapabilityProfile, capabilitiesForContext, CAPABILITY_PROFILE_SCHEMA_VERSION } from "../target/capabilities.js";
export { checkContextSafety, assertContextSafe, stripNoise } from "../target/context-check.js";
export { writeCapabilityProfile, loadCapabilityProfile, capabilityProfilePath } from "../target/capability-profile.js";
export {
	buildDatamodelProfile,
	findProjectJson,
	DATAMODEL_SCHEMA_VERSION,
} from "../target/datamodel.js";
export { checkDatamodelPaths, assertDatamodelSafe } from "../target/datamodel-check.js";
export { writeDatamodelArtifacts, generateDatamodelHeader } from "../target/datamodel-generate.js";
export { checkParallelSafety, assertParallelSafe } from "../target/parallel-check.js";
export { checkAuthority, assertAuthoritySafe, loadPlatformPolicy } from "../target/authority-check.js";
export { checkAuthorityGraph } from "../target/authority-graph.js";
export { checkComponentContracts } from "../target/component-contracts.js";
export { checkSecurity } from "../target/security-check.js";
export { checkLifetime } from "../target/lifetime-check.js";
export { adviseOptimizer, adviceAsDiagnostics } from "../target/optimizer-advise.js";
export { buildProjectGraph } from "../target/project-graph.js";
export { checkFlareVersions } from "../target/flare-version.js";
export { writeSourceMap } from "../target/source-map.js";
export { stampLuauFromClpp } from "../target/luau-stamp.js";
export { runDoctor } from "../target/doctor.js";
export { applyOptimizerHints } from "../target/optimizer-apply.js";
export {
	generateSoaLuau,
	applyLayoutPragmas,
	writeSoaArtifacts,
	collectSoaPlansFromProject,
	planSoa,
	listLayoutTargets,
} from "../target/optimizer-soa.js";
export { startStudioBridge, BRIDGE_DEFAULT_PORT } from "../target/studio-bridge.js";
export {
	loadProfile,
	writeProfileTemplate,
	rankAdvice,
	defaultProfilePath,
	ingestProfile,
	PGO_SCHEMA_VERSION,
} from "../target/pgo.js";
export { generateProjectDocs } from "../target/project-docs.js";
export {
	fingerprintSource,
	readCachedJob,
	writeCachedJob,
	mapPool,
	defaultJobCount,
	COMPILE_CACHE_SCHEMA,
} from "../target/build-cache.js";
export { buildReleaseChecklist, writeApiChangelog } from "./release.js";
export { timeCall, formatPerf } from "./perf.js";
export { validateOverrides, diffOverrideFiles } from "./overrides-validate.js";

export interface ManifestDocument {
	schemaVersion: typeof ROBLOX_TARGET_SCHEMA_VERSION;
	generatorVersion: string;
	profileHash: string;
	overridesHash: string;
	sources: RobloxTargetProfile["sources"];
	generatedAt: string;
}

export interface LockDocument {
	schemaVersion: typeof ROBLOX_TARGET_SCHEMA_VERSION;
	profileHash: string;
	overridesHash: string;
	robloxApiVersion?: string;
	files: Record<string, string>;
}

export function generateAll(options: {
	dumpPath?: string;
	skipHeaders?: boolean;
	skipLuau?: boolean;
	skipDocs?: boolean;
	skipLspIndex?: boolean;
} = {}): {
	profile: RobloxTargetProfile;
	manifestPath: string;
	lockPath: string;
	headerFiles: string[];
	luauFiles: string[];
	docFiles: string[];
	lspIndexPath: string | null;
} {
	const profile = buildRobloxTargetProfile({ dumpPath: options.dumpPath });
	writeProfileCache(profile);
	const headerFiles = options.skipHeaders ? [] : generateClppHeaders(profile).files;
	const luauFiles = options.skipLuau ? [] : generateLuauDefs(profile);
	const docFiles = options.skipDocs !== false ? [] : generateReferenceDocs(profile);
	const lspIndexPath = options.skipLspIndex ? null : writeLspIndex(profile);
	writeCapabilityProfile();

	const fileHashes: Record<string, string> = {};
	for (const file of [...headerFiles, ...luauFiles, ...(lspIndexPath ? [lspIndexPath] : [])]) {
		fileHashes[path.relative(projectRoot, file).replace(/\\/g, "/")] = hashBuffer(fs.readFileSync(file));
	}

	const profileHash = profileContentHash(profile);
	const oHash = overridesHash();
	const manifest: ManifestDocument = {
		schemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		generatorVersion: pkg.version,
		profileHash,
		overridesHash: oHash,
		sources: profile.sources,
		generatedAt: new Date().toISOString(),
	};
	const lock: LockDocument = {
		schemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		profileHash,
		overridesHash: oHash,
		robloxApiVersion: profile.robloxApiVersion,
		files: fileHashes,
	};

	const manifestsDir = path.join(projectRoot, "api", "manifests");
	fs.mkdirSync(manifestsDir, { recursive: true });
	const manifestPath = path.join(manifestsDir, "roblox-target.manifest.json");
	const lockPath = path.join(projectRoot, "api", "roblox-api.lock.json");
	atomicWriteJson(manifestPath, manifest);
	atomicWriteJson(lockPath, lock);

	return { profile, manifestPath, lockPath, headerFiles, luauFiles, docFiles, lspIndexPath };
}

function atomicWriteJson(file: string, value: unknown): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
	fs.renameSync(tmp, file);
}

export function verifyLock(): { ok: boolean; messages: string[] } {
	const lockPath = path.join(projectRoot, "api", "roblox-api.lock.json");
	const messages: string[] = [];
	if (!fs.existsSync(lockPath)) {
		return { ok: false, messages: ["roblox-api.lock.json missing — run cluaupp api generate"] };
	}
	const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as LockDocument;
	const profile = buildRobloxTargetProfile({ skipValidate: true });
	const profileHash = profileContentHash(profile);
	if (lock.profileHash !== profileHash) {
		messages.push(`profile hash mismatch: lock=${lock.profileHash.slice(0, 12)}… current=${profileHash.slice(0, 12)}…`);
	}
	if (lock.overridesHash !== overridesHash()) {
		messages.push("overrides hash mismatch");
	}
	for (const [rel, expected] of Object.entries(lock.files || {})) {
		const full = path.join(projectRoot, rel);
		if (!fs.existsSync(full)) {
			messages.push(`missing generated file ${rel}`);
			continue;
		}
		const actual = hashBuffer(fs.readFileSync(full));
		if (actual !== expected) {
			messages.push(`hash mismatch ${rel}`);
		}
	}
	return { ok: messages.length === 0, messages };
}

export function inspectSymbol(symbol: string): unknown {
	const profile = buildRobloxTargetProfile({ skipValidate: true });
	const registry = buildRegistry(profile);
	if (registry.classes.has(symbol)) {
		return registry.classes.get(symbol);
	}
	if (registry.enums.has(symbol)) {
		return registry.enums.get(symbol);
	}
	if (registry.datatypes.has(symbol)) {
		return registry.datatypes.get(symbol);
	}
	if (registry.members.has(symbol)) {
		return registry.members.get(symbol);
	}
	return searchRegistry(registry, symbol, 20);
}

export function apiCoverage(): ReturnType<typeof computeCoverage> {
	const profile = buildRobloxTargetProfile({ skipValidate: true });
	return computeCoverage(buildRegistry(profile));
}

export function apiDiffAgainstSnapshot(snapshotPath: string): ReturnType<typeof diffProfiles> {
	const before = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as RobloxTargetProfile;
	const after = buildRobloxTargetProfile({ skipValidate: true });
	return diffProfiles(before, after);
}

export function writeSnapshot(outPath?: string): string {
	const profile = buildRobloxTargetProfile();
	const target = outPath || path.join(projectRoot, "api", "snapshots", "latest.profile.json");
	writeProfileCache(profile, target);
	return target;
}

export function validateCurrent(): ReturnType<typeof validateProfile> {
	return validateProfile(buildRobloxTargetProfile({ skipValidate: true }));
}

export function analyzeLuauOutput(): Array<{ file: string; ok: boolean; output: string }> {
	const dir = path.join(projectRoot, "api", "generated", "luau");
	if (!fs.existsSync(dir)) {
		return [];
	}
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".luau"))
		.map((f) => {
			const file = path.join(dir, f);
			const result = tryLuauAnalyze(file);
			return { file, ...result };
		});
}
