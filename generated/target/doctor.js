"use strict";
/**
 * cluaupp doctor — run all platform checks and report.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDoctor = runDoctor;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const paths_js_1 = require("../clpp/paths.js");
const build_profile_js_1 = require("../api/build-profile.js");
const package_info_js_1 = require("../package-info.js");
const loader_js_1 = require("../api/loader.js");
const capability_profile_js_1 = require("./capability-profile.js");
const capabilities_js_1 = require("./capabilities.js");
const context_check_js_1 = require("./context-check.js");
const datamodel_generate_js_1 = require("./datamodel-generate.js");
const datamodel_check_js_1 = require("./datamodel-check.js");
const parallel_check_js_1 = require("./parallel-check.js");
const authority_check_js_1 = require("./authority-check.js");
const authority_graph_js_1 = require("./authority-graph.js");
const component_contracts_js_1 = require("./component-contracts.js");
const security_check_js_1 = require("./security-check.js");
const lifetime_check_js_1 = require("./lifetime-check.js");
const optimizer_advise_js_1 = require("./optimizer-advise.js");
const project_graph_js_1 = require("./project-graph.js");
const flare_version_js_1 = require("./flare-version.js");
function verifyLockLocal() {
    const lockPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "roblox-api.lock.json");
    if (!node_fs_1.default.existsSync(lockPath)) {
        return { ok: false, messages: ["missing api/roblox-api.lock.json"] };
    }
    try {
        const lock = JSON.parse(node_fs_1.default.readFileSync(lockPath, "utf8"));
        const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
        const messages = [];
        const ph = (0, build_profile_js_1.profileContentHash)(profile);
        if (lock.profileHash && lock.profileHash !== ph) {
            messages.push("profile hash drift — run cluaupp api generate");
        }
        if (lock.overridesHash && lock.overridesHash !== (0, loader_js_1.overridesHash)()) {
            messages.push("overrides hash drift — run cluaupp api generate");
        }
        return { ok: messages.length === 0, messages };
    }
    catch (err) {
        return { ok: false, messages: [err instanceof Error ? err.message : String(err)] };
    }
}
function runDoctor(gameRoot, rootDir = "src") {
    const checks = [];
    const srcDir = node_path_1.default.join(gameRoot, rootDir);
    const files = node_fs_1.default.existsSync(srcDir) ? (0, paths_js_1.collectSources)(srcDir) : [];
    const policy = (0, authority_check_js_1.loadPlatformPolicy)(gameRoot);
    try {
        (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
        checks.push({ name: "api-registry", ok: true });
    }
    catch (err) {
        checks.push({ name: "api-registry", ok: false, detail: err instanceof Error ? err.message : String(err) });
    }
    const lock = node_path_1.default.resolve(gameRoot) === node_path_1.default.resolve(package_info_js_1.projectRoot) ? verifyLockLocal() : { ok: true, messages: ["skipped (not Cluaupp package root)"] };
    checks.push({ name: "api-lock", ok: lock.ok, detail: lock.ok ? lock.messages[0] : lock.messages.join("; ") });
    (0, capability_profile_js_1.writeCapabilityProfile)();
    checks.push({ name: "context-profile", ok: true, detail: `${(0, capabilities_js_1.builtinCapabilityProfile)().rules.length} rules` });
    const dm = (0, datamodel_generate_js_1.writeDatamodelArtifacts)(gameRoot);
    checks.push({
        name: "datamodel",
        ok: Boolean(dm),
        detail: dm ? `${Object.keys(dm.profile.byPath).length} nodes` : "no default.project.json",
    });
    const allDiags = [];
    for (const file of files) {
        const rel = node_path_1.default.relative(gameRoot, file).replace(/\\/g, "/");
        const source = node_fs_1.default.readFileSync(file, "utf8");
        allDiags.push(...(0, context_check_js_1.checkContextSafety)(source, rel).map((d) => ({
            code: d.code,
            message: d.message,
            line: d.line,
            column: d.column,
            severity: d.severity,
            file: rel,
        })));
        allDiags.push(...(0, parallel_check_js_1.checkParallelSafety)(source, rel));
        allDiags.push(...(0, authority_check_js_1.checkAuthority)(source, rel, policy));
        allDiags.push(...(0, security_check_js_1.checkSecurity)(source, rel));
        allDiags.push(...(0, lifetime_check_js_1.checkLifetime)(source, rel));
        allDiags.push(...(0, optimizer_advise_js_1.adviceAsDiagnostics)((0, optimizer_advise_js_1.adviseOptimizer)(source, rel), rel));
        if (dm) {
            allDiags.push(...(0, datamodel_check_js_1.checkDatamodelPaths)(source, dm.profile).map((d) => ({
                code: d.code,
                message: d.message,
                line: d.line,
                column: d.column,
                severity: d.severity,
                file: rel,
            })));
        }
    }
    if (dm && policy.components?.length) {
        allDiags.push(...(0, component_contracts_js_1.checkComponentContracts)(dm.profile, policy.components));
    }
    const flare = (0, flare_version_js_1.checkFlareVersions)(gameRoot, rootDir);
    allDiags.push(...flare.conflicts);
    allDiags.push(...(0, authority_graph_js_1.checkAuthorityGraph)(gameRoot, rootDir, policy));
    const graph = (0, project_graph_js_1.buildProjectGraph)(gameRoot, rootDir);
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
