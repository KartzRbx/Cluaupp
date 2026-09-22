"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectJson = exports.buildDatamodelProfile = exports.capabilityProfilePath = exports.loadCapabilityProfile = exports.writeCapabilityProfile = exports.stripNoise = exports.assertContextSafe = exports.checkContextSafety = exports.CAPABILITY_PROFILE_SCHEMA_VERSION = exports.capabilitiesForContext = exports.builtinCapabilityProfile = exports.defaultRobloxProject = exports.runContextFromFileName = exports.resolveGetServiceType = exports.writeCache = exports.readCache = exports.cacheKeyHash = exports.computeCacheKey = exports.INTENT_RULES = exports.understandSymbol = exports.matchIntents = exports.RUNTIME_SUITE = exports.runStudioSmoke = exports.getApiRegistry = exports.suggestDidYouMean = exports.hoverSymbol = exports.completeMember = exports.similarSymbols = exports.describeSymbol = exports.listMembers = exports.isReserved = exports.escapeMember = exports.escapeIdent = exports.diffAgainstAuxTypes = exports.loadClientTrackerDump = exports.loadCreatorDocs = exports.loadLuauTypes = exports.loadStudioApiV2 = exports.loadStudioFullApi = exports.loadStudioApi = exports.loadMiniDump = exports.LSP_INDEX_SCHEMA_VERSION = exports.writeLspIndex = exports.buildLspIndex = exports.generateReferenceDocs = exports.generateLuauDefs = exports.generateClppHeaders = exports.profileContentHash = exports.writeProfileCache = exports.buildRobloxTargetProfile = void 0;
exports.diffOverrideFiles = exports.validateOverrides = exports.formatPerf = exports.timeCall = exports.writeApiChangelog = exports.buildReleaseChecklist = exports.COMPILE_CACHE_SCHEMA = exports.defaultJobCount = exports.mapPool = exports.writeCachedJob = exports.readCachedJob = exports.fingerprintSource = exports.generateProjectDocs = exports.PGO_SCHEMA_VERSION = exports.ingestProfile = exports.defaultProfilePath = exports.rankAdvice = exports.writeProfileTemplate = exports.loadProfile = exports.BRIDGE_DEFAULT_PORT = exports.startStudioBridge = exports.listLayoutTargets = exports.planSoa = exports.collectSoaPlansFromProject = exports.writeSoaArtifacts = exports.applyLayoutPragmas = exports.generateSoaLuau = exports.applyOptimizerHints = exports.runDoctor = exports.stampLuauFromClpp = exports.writeSourceMap = exports.checkFlareVersions = exports.buildProjectGraph = exports.adviceAsDiagnostics = exports.adviseOptimizer = exports.checkLifetime = exports.checkSecurity = exports.checkComponentContracts = exports.checkAuthorityGraph = exports.loadPlatformPolicy = exports.assertAuthoritySafe = exports.checkAuthority = exports.assertParallelSafe = exports.checkParallelSafety = exports.generateDatamodelHeader = exports.writeDatamodelArtifacts = exports.assertDatamodelSafe = exports.checkDatamodelPaths = exports.DATAMODEL_SCHEMA_VERSION = void 0;
exports.generateAll = generateAll;
exports.verifyLock = verifyLock;
exports.inspectSymbol = inspectSymbol;
exports.apiCoverage = apiCoverage;
exports.apiDiffAgainstSnapshot = apiDiffAgainstSnapshot;
exports.writeSnapshot = writeSnapshot;
exports.validateCurrent = validateCurrent;
exports.analyzeLuauOutput = analyzeLuauOutput;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const package_info_js_2 = require("../package-info.js");
const build_profile_js_1 = require("./build-profile.js");
const coverage_js_1 = require("./coverage.js");
const diff_js_1 = require("./diff.js");
const clpp_headers_js_1 = require("./generators/clpp-headers.js");
const luau_defs_js_1 = require("./generators/luau-defs.js");
const docs_reference_js_1 = require("./generators/docs-reference.js");
const lsp_index_js_1 = require("./generators/lsp-index.js");
const capability_profile_js_1 = require("../target/capability-profile.js");
const loader_js_1 = require("./loader.js");
const model_js_1 = require("./model.js");
const registry_js_1 = require("./registry.js");
const resolver_js_1 = require("./resolver.js");
const validate_js_1 = require("./validate.js");
__exportStar(require("./model.js"), exports);
__exportStar(require("./resolver.js"), exports);
__exportStar(require("./identifier.js"), exports);
__exportStar(require("./registry.js"), exports);
__exportStar(require("./diff.js"), exports);
__exportStar(require("./coverage.js"), exports);
var build_profile_js_2 = require("./build-profile.js");
Object.defineProperty(exports, "buildRobloxTargetProfile", { enumerable: true, get: function () { return build_profile_js_2.buildRobloxTargetProfile; } });
Object.defineProperty(exports, "writeProfileCache", { enumerable: true, get: function () { return build_profile_js_2.writeProfileCache; } });
Object.defineProperty(exports, "profileContentHash", { enumerable: true, get: function () { return build_profile_js_2.profileContentHash; } });
var clpp_headers_js_2 = require("./generators/clpp-headers.js");
Object.defineProperty(exports, "generateClppHeaders", { enumerable: true, get: function () { return clpp_headers_js_2.generateClppHeaders; } });
var luau_defs_js_2 = require("./generators/luau-defs.js");
Object.defineProperty(exports, "generateLuauDefs", { enumerable: true, get: function () { return luau_defs_js_2.generateLuauDefs; } });
var docs_reference_js_2 = require("./generators/docs-reference.js");
Object.defineProperty(exports, "generateReferenceDocs", { enumerable: true, get: function () { return docs_reference_js_2.generateReferenceDocs; } });
var lsp_index_js_2 = require("./generators/lsp-index.js");
Object.defineProperty(exports, "buildLspIndex", { enumerable: true, get: function () { return lsp_index_js_2.buildLspIndex; } });
Object.defineProperty(exports, "writeLspIndex", { enumerable: true, get: function () { return lsp_index_js_2.writeLspIndex; } });
Object.defineProperty(exports, "LSP_INDEX_SCHEMA_VERSION", { enumerable: true, get: function () { return lsp_index_js_2.LSP_INDEX_SCHEMA_VERSION; } });
var mini_dump_js_1 = require("./sources/mini-dump.js");
Object.defineProperty(exports, "loadMiniDump", { enumerable: true, get: function () { return mini_dump_js_1.loadMiniDump; } });
var studio_api_js_1 = require("./sources/studio-api.js");
Object.defineProperty(exports, "loadStudioApi", { enumerable: true, get: function () { return studio_api_js_1.loadStudioApi; } });
var studio_full_api_js_1 = require("./sources/studio-full-api.js");
Object.defineProperty(exports, "loadStudioFullApi", { enumerable: true, get: function () { return studio_full_api_js_1.loadStudioFullApi; } });
var studio_apiv2_js_1 = require("./sources/studio-apiv2.js");
Object.defineProperty(exports, "loadStudioApiV2", { enumerable: true, get: function () { return studio_apiv2_js_1.loadStudioApiV2; } });
var luau_types_js_1 = require("./sources/luau-types.js");
Object.defineProperty(exports, "loadLuauTypes", { enumerable: true, get: function () { return luau_types_js_1.loadLuauTypes; } });
var creator_docs_js_1 = require("./sources/creator-docs.js");
Object.defineProperty(exports, "loadCreatorDocs", { enumerable: true, get: function () { return creator_docs_js_1.loadCreatorDocs; } });
var client_tracker_js_1 = require("./sources/client-tracker.js");
Object.defineProperty(exports, "loadClientTrackerDump", { enumerable: true, get: function () { return client_tracker_js_1.loadClientTrackerDump; } });
var aux_types_diff_js_1 = require("./sources/aux-types-diff.js");
Object.defineProperty(exports, "diffAgainstAuxTypes", { enumerable: true, get: function () { return aux_types_diff_js_1.diffAgainstAuxTypes; } });
var identifier_js_1 = require("./identifier.js");
Object.defineProperty(exports, "escapeIdent", { enumerable: true, get: function () { return identifier_js_1.escapeIdent; } });
Object.defineProperty(exports, "escapeMember", { enumerable: true, get: function () { return identifier_js_1.escapeMember; } });
Object.defineProperty(exports, "isReserved", { enumerable: true, get: function () { return identifier_js_1.isReserved; } });
var ide_js_1 = require("./ide.js");
Object.defineProperty(exports, "listMembers", { enumerable: true, get: function () { return ide_js_1.listMembers; } });
Object.defineProperty(exports, "describeSymbol", { enumerable: true, get: function () { return ide_js_1.describeSymbol; } });
Object.defineProperty(exports, "similarSymbols", { enumerable: true, get: function () { return ide_js_1.similarSymbols; } });
Object.defineProperty(exports, "completeMember", { enumerable: true, get: function () { return ide_js_1.completeMember; } });
Object.defineProperty(exports, "hoverSymbol", { enumerable: true, get: function () { return ide_js_1.hoverSymbol; } });
Object.defineProperty(exports, "suggestDidYouMean", { enumerable: true, get: function () { return ide_js_1.suggestDidYouMean; } });
Object.defineProperty(exports, "getApiRegistry", { enumerable: true, get: function () { return ide_js_1.getApiRegistry; } });
var studio_smoke_js_1 = require("./studio-smoke.js");
Object.defineProperty(exports, "runStudioSmoke", { enumerable: true, get: function () { return studio_smoke_js_1.runStudioSmoke; } });
Object.defineProperty(exports, "RUNTIME_SUITE", { enumerable: true, get: function () { return studio_smoke_js_1.RUNTIME_SUITE; } });
var understander_js_1 = require("./understander.js");
Object.defineProperty(exports, "matchIntents", { enumerable: true, get: function () { return understander_js_1.matchIntents; } });
Object.defineProperty(exports, "understandSymbol", { enumerable: true, get: function () { return understander_js_1.understandSymbol; } });
Object.defineProperty(exports, "INTENT_RULES", { enumerable: true, get: function () { return understander_js_1.INTENT_RULES; } });
var cache_js_1 = require("./cache.js");
Object.defineProperty(exports, "computeCacheKey", { enumerable: true, get: function () { return cache_js_1.computeCacheKey; } });
Object.defineProperty(exports, "cacheKeyHash", { enumerable: true, get: function () { return cache_js_1.cacheKeyHash; } });
Object.defineProperty(exports, "readCache", { enumerable: true, get: function () { return cache_js_1.readCache; } });
Object.defineProperty(exports, "writeCache", { enumerable: true, get: function () { return cache_js_1.writeCache; } });
var roblox_js_1 = require("../target/roblox.js");
Object.defineProperty(exports, "resolveGetServiceType", { enumerable: true, get: function () { return roblox_js_1.resolveGetServiceType; } });
Object.defineProperty(exports, "runContextFromFileName", { enumerable: true, get: function () { return roblox_js_1.runContextFromFileName; } });
Object.defineProperty(exports, "defaultRobloxProject", { enumerable: true, get: function () { return roblox_js_1.defaultRobloxProject; } });
var capabilities_js_1 = require("../target/capabilities.js");
Object.defineProperty(exports, "builtinCapabilityProfile", { enumerable: true, get: function () { return capabilities_js_1.builtinCapabilityProfile; } });
Object.defineProperty(exports, "capabilitiesForContext", { enumerable: true, get: function () { return capabilities_js_1.capabilitiesForContext; } });
Object.defineProperty(exports, "CAPABILITY_PROFILE_SCHEMA_VERSION", { enumerable: true, get: function () { return capabilities_js_1.CAPABILITY_PROFILE_SCHEMA_VERSION; } });
var context_check_js_1 = require("../target/context-check.js");
Object.defineProperty(exports, "checkContextSafety", { enumerable: true, get: function () { return context_check_js_1.checkContextSafety; } });
Object.defineProperty(exports, "assertContextSafe", { enumerable: true, get: function () { return context_check_js_1.assertContextSafe; } });
Object.defineProperty(exports, "stripNoise", { enumerable: true, get: function () { return context_check_js_1.stripNoise; } });
var capability_profile_js_2 = require("../target/capability-profile.js");
Object.defineProperty(exports, "writeCapabilityProfile", { enumerable: true, get: function () { return capability_profile_js_2.writeCapabilityProfile; } });
Object.defineProperty(exports, "loadCapabilityProfile", { enumerable: true, get: function () { return capability_profile_js_2.loadCapabilityProfile; } });
Object.defineProperty(exports, "capabilityProfilePath", { enumerable: true, get: function () { return capability_profile_js_2.capabilityProfilePath; } });
var datamodel_js_1 = require("../target/datamodel.js");
Object.defineProperty(exports, "buildDatamodelProfile", { enumerable: true, get: function () { return datamodel_js_1.buildDatamodelProfile; } });
Object.defineProperty(exports, "findProjectJson", { enumerable: true, get: function () { return datamodel_js_1.findProjectJson; } });
Object.defineProperty(exports, "DATAMODEL_SCHEMA_VERSION", { enumerable: true, get: function () { return datamodel_js_1.DATAMODEL_SCHEMA_VERSION; } });
var datamodel_check_js_1 = require("../target/datamodel-check.js");
Object.defineProperty(exports, "checkDatamodelPaths", { enumerable: true, get: function () { return datamodel_check_js_1.checkDatamodelPaths; } });
Object.defineProperty(exports, "assertDatamodelSafe", { enumerable: true, get: function () { return datamodel_check_js_1.assertDatamodelSafe; } });
var datamodel_generate_js_1 = require("../target/datamodel-generate.js");
Object.defineProperty(exports, "writeDatamodelArtifacts", { enumerable: true, get: function () { return datamodel_generate_js_1.writeDatamodelArtifacts; } });
Object.defineProperty(exports, "generateDatamodelHeader", { enumerable: true, get: function () { return datamodel_generate_js_1.generateDatamodelHeader; } });
var parallel_check_js_1 = require("../target/parallel-check.js");
Object.defineProperty(exports, "checkParallelSafety", { enumerable: true, get: function () { return parallel_check_js_1.checkParallelSafety; } });
Object.defineProperty(exports, "assertParallelSafe", { enumerable: true, get: function () { return parallel_check_js_1.assertParallelSafe; } });
var authority_check_js_1 = require("../target/authority-check.js");
Object.defineProperty(exports, "checkAuthority", { enumerable: true, get: function () { return authority_check_js_1.checkAuthority; } });
Object.defineProperty(exports, "assertAuthoritySafe", { enumerable: true, get: function () { return authority_check_js_1.assertAuthoritySafe; } });
Object.defineProperty(exports, "loadPlatformPolicy", { enumerable: true, get: function () { return authority_check_js_1.loadPlatformPolicy; } });
var authority_graph_js_1 = require("../target/authority-graph.js");
Object.defineProperty(exports, "checkAuthorityGraph", { enumerable: true, get: function () { return authority_graph_js_1.checkAuthorityGraph; } });
var component_contracts_js_1 = require("../target/component-contracts.js");
Object.defineProperty(exports, "checkComponentContracts", { enumerable: true, get: function () { return component_contracts_js_1.checkComponentContracts; } });
var security_check_js_1 = require("../target/security-check.js");
Object.defineProperty(exports, "checkSecurity", { enumerable: true, get: function () { return security_check_js_1.checkSecurity; } });
var lifetime_check_js_1 = require("../target/lifetime-check.js");
Object.defineProperty(exports, "checkLifetime", { enumerable: true, get: function () { return lifetime_check_js_1.checkLifetime; } });
var optimizer_advise_js_1 = require("../target/optimizer-advise.js");
Object.defineProperty(exports, "adviseOptimizer", { enumerable: true, get: function () { return optimizer_advise_js_1.adviseOptimizer; } });
Object.defineProperty(exports, "adviceAsDiagnostics", { enumerable: true, get: function () { return optimizer_advise_js_1.adviceAsDiagnostics; } });
var project_graph_js_1 = require("../target/project-graph.js");
Object.defineProperty(exports, "buildProjectGraph", { enumerable: true, get: function () { return project_graph_js_1.buildProjectGraph; } });
var flare_version_js_1 = require("../target/flare-version.js");
Object.defineProperty(exports, "checkFlareVersions", { enumerable: true, get: function () { return flare_version_js_1.checkFlareVersions; } });
var source_map_js_1 = require("../target/source-map.js");
Object.defineProperty(exports, "writeSourceMap", { enumerable: true, get: function () { return source_map_js_1.writeSourceMap; } });
var luau_stamp_js_1 = require("../target/luau-stamp.js");
Object.defineProperty(exports, "stampLuauFromClpp", { enumerable: true, get: function () { return luau_stamp_js_1.stampLuauFromClpp; } });
var doctor_js_1 = require("../target/doctor.js");
Object.defineProperty(exports, "runDoctor", { enumerable: true, get: function () { return doctor_js_1.runDoctor; } });
var optimizer_apply_js_1 = require("../target/optimizer-apply.js");
Object.defineProperty(exports, "applyOptimizerHints", { enumerable: true, get: function () { return optimizer_apply_js_1.applyOptimizerHints; } });
var optimizer_soa_js_1 = require("../target/optimizer-soa.js");
Object.defineProperty(exports, "generateSoaLuau", { enumerable: true, get: function () { return optimizer_soa_js_1.generateSoaLuau; } });
Object.defineProperty(exports, "applyLayoutPragmas", { enumerable: true, get: function () { return optimizer_soa_js_1.applyLayoutPragmas; } });
Object.defineProperty(exports, "writeSoaArtifacts", { enumerable: true, get: function () { return optimizer_soa_js_1.writeSoaArtifacts; } });
Object.defineProperty(exports, "collectSoaPlansFromProject", { enumerable: true, get: function () { return optimizer_soa_js_1.collectSoaPlansFromProject; } });
Object.defineProperty(exports, "planSoa", { enumerable: true, get: function () { return optimizer_soa_js_1.planSoa; } });
Object.defineProperty(exports, "listLayoutTargets", { enumerable: true, get: function () { return optimizer_soa_js_1.listLayoutTargets; } });
var studio_bridge_js_1 = require("../target/studio-bridge.js");
Object.defineProperty(exports, "startStudioBridge", { enumerable: true, get: function () { return studio_bridge_js_1.startStudioBridge; } });
Object.defineProperty(exports, "BRIDGE_DEFAULT_PORT", { enumerable: true, get: function () { return studio_bridge_js_1.BRIDGE_DEFAULT_PORT; } });
var pgo_js_1 = require("../target/pgo.js");
Object.defineProperty(exports, "loadProfile", { enumerable: true, get: function () { return pgo_js_1.loadProfile; } });
Object.defineProperty(exports, "writeProfileTemplate", { enumerable: true, get: function () { return pgo_js_1.writeProfileTemplate; } });
Object.defineProperty(exports, "rankAdvice", { enumerable: true, get: function () { return pgo_js_1.rankAdvice; } });
Object.defineProperty(exports, "defaultProfilePath", { enumerable: true, get: function () { return pgo_js_1.defaultProfilePath; } });
Object.defineProperty(exports, "ingestProfile", { enumerable: true, get: function () { return pgo_js_1.ingestProfile; } });
Object.defineProperty(exports, "PGO_SCHEMA_VERSION", { enumerable: true, get: function () { return pgo_js_1.PGO_SCHEMA_VERSION; } });
var project_docs_js_1 = require("../target/project-docs.js");
Object.defineProperty(exports, "generateProjectDocs", { enumerable: true, get: function () { return project_docs_js_1.generateProjectDocs; } });
var build_cache_js_1 = require("../target/build-cache.js");
Object.defineProperty(exports, "fingerprintSource", { enumerable: true, get: function () { return build_cache_js_1.fingerprintSource; } });
Object.defineProperty(exports, "readCachedJob", { enumerable: true, get: function () { return build_cache_js_1.readCachedJob; } });
Object.defineProperty(exports, "writeCachedJob", { enumerable: true, get: function () { return build_cache_js_1.writeCachedJob; } });
Object.defineProperty(exports, "mapPool", { enumerable: true, get: function () { return build_cache_js_1.mapPool; } });
Object.defineProperty(exports, "defaultJobCount", { enumerable: true, get: function () { return build_cache_js_1.defaultJobCount; } });
Object.defineProperty(exports, "COMPILE_CACHE_SCHEMA", { enumerable: true, get: function () { return build_cache_js_1.COMPILE_CACHE_SCHEMA; } });
var release_js_1 = require("./release.js");
Object.defineProperty(exports, "buildReleaseChecklist", { enumerable: true, get: function () { return release_js_1.buildReleaseChecklist; } });
Object.defineProperty(exports, "writeApiChangelog", { enumerable: true, get: function () { return release_js_1.writeApiChangelog; } });
var perf_js_1 = require("./perf.js");
Object.defineProperty(exports, "timeCall", { enumerable: true, get: function () { return perf_js_1.timeCall; } });
Object.defineProperty(exports, "formatPerf", { enumerable: true, get: function () { return perf_js_1.formatPerf; } });
var overrides_validate_js_1 = require("./overrides-validate.js");
Object.defineProperty(exports, "validateOverrides", { enumerable: true, get: function () { return overrides_validate_js_1.validateOverrides; } });
Object.defineProperty(exports, "diffOverrideFiles", { enumerable: true, get: function () { return overrides_validate_js_1.diffOverrideFiles; } });
function generateAll(options = {}) {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ dumpPath: options.dumpPath });
    (0, build_profile_js_1.writeProfileCache)(profile);
    const headerFiles = options.skipHeaders ? [] : (0, clpp_headers_js_1.generateClppHeaders)(profile).files;
    const luauFiles = options.skipLuau ? [] : (0, luau_defs_js_1.generateLuauDefs)(profile);
    const docFiles = options.skipDocs !== false ? [] : (0, docs_reference_js_1.generateReferenceDocs)(profile);
    const lspIndexPath = options.skipLspIndex ? null : (0, lsp_index_js_1.writeLspIndex)(profile);
    (0, capability_profile_js_1.writeCapabilityProfile)();
    const fileHashes = {};
    for (const file of [...headerFiles, ...luauFiles, ...(lspIndexPath ? [lspIndexPath] : [])]) {
        fileHashes[node_path_1.default.relative(package_info_js_1.projectRoot, file).replace(/\\/g, "/")] = (0, resolver_js_1.hashBuffer)(node_fs_1.default.readFileSync(file));
    }
    const profileHash = (0, build_profile_js_1.profileContentHash)(profile);
    const oHash = (0, loader_js_1.overridesHash)();
    const manifest = {
        schemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        generatorVersion: package_info_js_2.pkg.version,
        profileHash,
        overridesHash: oHash,
        sources: profile.sources,
        generatedAt: new Date().toISOString(),
    };
    const lock = {
        schemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        profileHash,
        overridesHash: oHash,
        robloxApiVersion: profile.robloxApiVersion,
        files: fileHashes,
    };
    const manifestsDir = node_path_1.default.join(package_info_js_1.projectRoot, "api", "manifests");
    node_fs_1.default.mkdirSync(manifestsDir, { recursive: true });
    const manifestPath = node_path_1.default.join(manifestsDir, "roblox-target.manifest.json");
    const lockPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "roblox-api.lock.json");
    atomicWriteJson(manifestPath, manifest);
    atomicWriteJson(lockPath, lock);
    return { profile, manifestPath, lockPath, headerFiles, luauFiles, docFiles, lspIndexPath };
}
function atomicWriteJson(file, value) {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
    node_fs_1.default.renameSync(tmp, file);
}
function verifyLock() {
    const lockPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "roblox-api.lock.json");
    const messages = [];
    if (!node_fs_1.default.existsSync(lockPath)) {
        return { ok: false, messages: ["roblox-api.lock.json missing — run cluaupp api generate"] };
    }
    const lock = JSON.parse(node_fs_1.default.readFileSync(lockPath, "utf8"));
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    const profileHash = (0, build_profile_js_1.profileContentHash)(profile);
    if (lock.profileHash !== profileHash) {
        messages.push(`profile hash mismatch: lock=${lock.profileHash.slice(0, 12)}… current=${profileHash.slice(0, 12)}…`);
    }
    if (lock.overridesHash !== (0, loader_js_1.overridesHash)()) {
        messages.push("overrides hash mismatch");
    }
    for (const [rel, expected] of Object.entries(lock.files || {})) {
        const full = node_path_1.default.join(package_info_js_1.projectRoot, rel);
        if (!node_fs_1.default.existsSync(full)) {
            messages.push(`missing generated file ${rel}`);
            continue;
        }
        const actual = (0, resolver_js_1.hashBuffer)(node_fs_1.default.readFileSync(full));
        if (actual !== expected) {
            messages.push(`hash mismatch ${rel}`);
        }
    }
    return { ok: messages.length === 0, messages };
}
function inspectSymbol(symbol) {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    const registry = (0, registry_js_1.buildRegistry)(profile);
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
    return (0, registry_js_1.searchRegistry)(registry, symbol, 20);
}
function apiCoverage() {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    return (0, coverage_js_1.computeCoverage)((0, registry_js_1.buildRegistry)(profile));
}
function apiDiffAgainstSnapshot(snapshotPath) {
    const before = JSON.parse(node_fs_1.default.readFileSync(snapshotPath, "utf8"));
    const after = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    return (0, diff_js_1.diffProfiles)(before, after);
}
function writeSnapshot(outPath) {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)();
    const target = outPath || node_path_1.default.join(package_info_js_1.projectRoot, "api", "snapshots", "latest.profile.json");
    (0, build_profile_js_1.writeProfileCache)(profile, target);
    return target;
}
function validateCurrent() {
    return (0, validate_js_1.validateProfile)((0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true }));
}
function analyzeLuauOutput() {
    const dir = node_path_1.default.join(package_info_js_1.projectRoot, "api", "generated", "luau");
    if (!node_fs_1.default.existsSync(dir)) {
        return [];
    }
    return node_fs_1.default
        .readdirSync(dir)
        .filter((f) => f.endsWith(".luau"))
        .map((f) => {
        const file = node_path_1.default.join(dir, f);
        const result = (0, luau_defs_js_1.tryLuauAnalyze)(file);
        return { file, ...result };
    });
}
