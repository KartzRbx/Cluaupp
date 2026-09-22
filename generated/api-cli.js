"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiCommands = registerApiCommands;
exports.registerTargetCommands = registerTargetCommands;
exports.registerPlatformCommands = registerPlatformCommands;
const node_path_1 = __importDefault(require("node:path"));
const index_js_1 = require("./api/index.js");
const package_info_js_1 = require("./package-info.js");
const node_fs_1 = __importDefault(require("node:fs"));
const paths_js_1 = require("./clpp/paths.js");
const node_child_process_1 = require("node:child_process");
const optimizer_apply_js_1 = require("./target/optimizer-apply.js");
const pgo_js_1 = require("./target/pgo.js");
const project_docs_js_1 = require("./target/project-docs.js");
const studio_bridge_js_1 = require("./target/studio-bridge.js");
const optimizer_soa_js_1 = require("./target/optimizer-soa.js");
function registerApiCommands(program) {
    const api = program.command("api").description("Roblox API registry (Cluaupp target)");
    api
        .command("update")
        .description("Rebuild profile from dump + overrides (alias of generate)")
        .option("--dump <path>", "Mini-API-Dump.json path")
        .action((opts) => {
        runGenerate(opts.dump);
    });
    api
        .command("generate")
        .description("Build RobloxTargetProfile and regenerate CL++ / Luau projections")
        .option("--dump <path>", "Mini-API-Dump.json path")
        .option("--skip-headers", "Skip CL++ header generation")
        .option("--skip-luau", "Skip .d.luau generation")
        .option("--docs", "No-op retained for CLI compat (Creator Docs are not mirrored)")
        .action((opts) => {
        runGenerate(opts.dump, opts.skipHeaders, opts.skipLuau, true);
    });
    api
        .command("verify")
        .description("Verify roblox-api.lock.json against current sources")
        .action(() => {
        const result = (0, index_js_1.verifyLock)();
        if (!result.ok) {
            console.error("cluaupp api verify: FAILED");
            for (const m of result.messages) {
                console.error(" -", m);
            }
            process.exit(1);
        }
        console.log("cluaupp api verify: OK");
    });
    api
        .command("diff")
        .description("Diff current profile against a snapshot")
        .argument("<snapshot>", "path to previous profile JSON")
        .action((snapshot) => {
        const entries = (0, index_js_1.apiDiffAgainstSnapshot)(node_path_1.default.resolve(snapshot));
        console.log(JSON.stringify(entries, null, "\t"));
        console.log(`cluaupp api diff: ${entries.length} change(s)`);
    });
    api
        .command("inspect")
        .description("Inspect a class, enum, datatype, or member")
        .argument("<symbol>", "e.g. Players, Players.PlayerAdded, Vector3")
        .action((symbol) => {
        console.log(JSON.stringify((0, index_js_1.inspectSymbol)(symbol), null, "\t"));
    });
    api
        .command("search")
        .description("Search registry symbols")
        .argument("<query>", "substring query")
        .action((query) => {
        const profile = (0, index_js_1.buildRobloxTargetProfile)({ skipValidate: true });
        console.log(JSON.stringify((0, index_js_1.searchRegistry)((0, index_js_1.buildRegistry)(profile), query), null, "\t"));
    });
    api
        .command("coverage")
        .description("Report API surface coverage and UnsupportedRepresentation gaps")
        .action(() => {
        console.log(JSON.stringify((0, index_js_1.apiCoverage)(), null, "\t"));
    });
    api
        .command("snapshot")
        .description("Write api/snapshots/latest.profile.json")
        .option("-o, --output <path>", "output path")
        .action((opts) => {
        const p = (0, index_js_1.writeSnapshot)(opts.output);
        console.log("cluaupp api snapshot:", p);
    });
    api
        .command("validate")
        .description("Validate current RobloxTargetProfile")
        .action(() => {
        const issues = (0, index_js_1.validateCurrent)();
        const errors = issues.filter((i) => i.severity === "error");
        console.log(JSON.stringify(issues, null, "\t"));
        if (errors.length) {
            process.exit(1);
        }
    });
    api
        .command("analyze-luau")
        .description("Run luau-analyze on generated .d.luau if available")
        .action(() => {
        const results = (0, index_js_1.analyzeLuauOutput)();
        console.log(JSON.stringify(results, null, "\t"));
    });
    api
        .command("aux-diff")
        .description("Coverage cross-check vs local @rbxts/types or LuauTypes (not on compile path)")
        .argument("<path>", "file or directory of auxiliary types")
        .action((auxPath) => {
        const profile = (0, index_js_1.buildRobloxTargetProfile)({ skipValidate: true });
        const names = [
            ...Object.keys(profile.classes),
            ...Object.keys(profile.enums),
            ...Object.keys(profile.datatypes),
        ];
        const report = (0, index_js_1.diffAgainstAuxTypes)(names, node_path_1.default.resolve(auxPath));
        console.log(JSON.stringify({
            source: report.source,
            auxSymbols: report.auxSymbols,
            registrySymbols: report.registrySymbols,
            onlyInAuxCount: report.onlyInAux.length,
            onlyInRegistryCount: report.onlyInRegistry.length,
            onlyInAuxSample: report.onlyInAux.slice(0, 40),
            onlyInRegistrySample: report.onlyInRegistry.slice(0, 40),
        }, null, "\t"));
    });
}
function registerTargetCommands(program) {
    const target = program.command("target").description("Cluaupp Roblox target profile");
    target
        .command("info")
        .description("Print target identity and schema version")
        .action(() => {
        const profile = (0, index_js_1.buildRobloxTargetProfile)({ skipValidate: true });
        console.log(JSON.stringify({
            target: "roblox",
            schemaVersion: index_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
            cluaupp: package_info_js_1.pkg.version,
            robloxApiVersion: profile.robloxApiVersion,
            classes: Object.keys(profile.classes).length,
            enums: Object.keys(profile.enums).length,
            datatypes: Object.keys(profile.datatypes).length,
            services: Object.keys(profile.services).length,
            unsupported: profile.unsupported.length,
        }, null, "\t"));
    });
    target
        .command("doctor")
        .description("Full platform check: registry, lock, DataModel, parallel, authority, security, graph, Flare")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        const root = node_path_1.default.resolve(folder);
        const report = (0, index_js_1.runDoctor)(root);
        console.log(JSON.stringify(report, null, "\t"));
        if (!report.ok) {
            process.exit(1);
        }
    });
    target
        .command("capabilities")
        .description("Print Context Safety capability profile (runContext rules)")
        .action(() => {
        const pathOut = (0, index_js_1.writeCapabilityProfile)();
        console.log(JSON.stringify((0, index_js_1.builtinCapabilityProfile)(), null, "\t"));
        console.log("wrote", pathOut);
    });
    target
        .command("check-context")
        .description("Scan a .clpp file for Context Safety violations")
        .argument("<file>", "CL++ source path")
        .action((file) => {
        const abs = node_path_1.default.resolve(file);
        const source = node_fs_1.default.readFileSync(abs, "utf8");
        const violations = (0, index_js_1.checkContextSafety)(source, abs);
        console.log(JSON.stringify(violations, null, "\t"));
        if (violations.some((v) => v.severity === "error")) {
            process.exit(1);
        }
    });
    target
        .command("datamodel")
        .description("Build Typed DataModel profile + generated datamodel.clh from Rojo project")
        .argument("[folder]", "game root with default.project.json", ".")
        .option("-r, --rojo <path>", "Rojo project json")
        .action((folder, options) => {
        const root = node_path_1.default.resolve(folder);
        const result = (0, index_js_1.writeDatamodelArtifacts)(root, { projectJson: options.rojo });
        if (!result) {
            console.error("cluaupp target datamodel: no default.project.json in", root);
            process.exit(1);
        }
        const paths = Object.keys(result.profile.byPath).filter((p) => p !== "DataModel");
        console.log(JSON.stringify({
            project: result.profile.projectName,
            nodes: paths.length,
            profile: result.profilePath,
            header: result.headerPath,
            sample: paths.slice(0, 20),
        }, null, "\t"));
    });
    target
        .command("check-datamodel")
        .description("Scan a .clpp file for Typed DataModel path violations")
        .argument("<file>", "CL++ source path")
        .option("-r, --rojo <folder>", "game root with default.project.json", ".")
        .action((file, options) => {
        const abs = node_path_1.default.resolve(file);
        const root = node_path_1.default.resolve(options.rojo || ".");
        const profile = (0, index_js_1.buildDatamodelProfile)(root);
        if (!profile) {
            console.error("cluaupp target check-datamodel: no default.project.json in", root);
            process.exit(1);
        }
        const source = node_fs_1.default.readFileSync(abs, "utf8");
        const violations = (0, index_js_1.checkDatamodelPaths)(source, profile);
        console.log(JSON.stringify(violations, null, "\t"));
        if (violations.some((v) => v.severity === "error")) {
            process.exit(1);
        }
    });
    target
        .command("check-parallel")
        .description("Scan a .clpp file for Unsafe API use in parallel regions")
        .argument("<file>", "CL++ source path")
        .action((file) => {
        const abs = node_path_1.default.resolve(file);
        const source = node_fs_1.default.readFileSync(abs, "utf8");
        const diags = (0, index_js_1.checkParallelSafety)(source, abs);
        console.log(JSON.stringify(diags, null, "\t"));
        if (diags.some((d) => d.severity === "error"))
            process.exit(1);
    });
    target
        .command("graph")
        .description("Print project include graph and cycles")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        console.log(JSON.stringify((0, index_js_1.buildProjectGraph)(node_path_1.default.resolve(folder)), null, "\t"));
    });
    target
        .command("verify")
        .description("Alias of api verify + profile validate")
        .action(() => {
        const issues = (0, index_js_1.validateCurrent)().filter((i) => i.severity === "error");
        const lock = (0, index_js_1.verifyLock)();
        if (issues.length || !lock.ok) {
            console.error("cluaupp target verify: FAILED");
            process.exit(1);
        }
        console.log("cluaupp target verify: OK");
    });
    target
        .command("diff")
        .argument("<snapshot>", "previous profile JSON")
        .action((snapshot) => {
        console.log(JSON.stringify((0, index_js_1.apiDiffAgainstSnapshot)(node_path_1.default.resolve(snapshot)), null, "\t"));
    });
    target
        .command("lock")
        .description("Regenerate lock from current sources (via api generate)")
        .action(() => {
        runGenerate();
    });
}
function registerPlatformCommands(program) {
    program
        .command("optimize")
        .description("Advisor + optional apply: native pragmas, SoA layout codegen")
        .argument("[folder]", "game root", ".")
        .option("--profile <file>", "Rank advice with cluaupp.profile.json (PGO)")
        .option("--apply", "Write #pragma native (and --layout pragmas) into sources")
        .option("--layout", "With --apply: #pragma layout soa + emit .cluaupp/generated/soa/*Soa.luau")
        .option("--buffer", "With --layout: pack f32/i32 columns into buffer")
        .action((folder, opts) => {
        const root = node_path_1.default.resolve(folder);
        const src = node_path_1.default.join(root, "src");
        const files = node_fs_1.default.existsSync(src) ? (0, paths_js_1.collectSources)(src) : [];
        const profilePath = opts.profile ? node_path_1.default.resolve(root, opts.profile) : (0, pgo_js_1.defaultProfilePath)(root);
        const profile = (0, pgo_js_1.loadProfile)(profilePath);
        const advice = [];
        let appliedCount = 0;
        for (const file of files) {
            const rel = node_path_1.default.relative(root, file).replace(/\\/g, "/");
            const source = node_fs_1.default.readFileSync(file, "utf8");
            const ranked = (0, pgo_js_1.rankAdvice)((0, index_js_1.adviseOptimizer)(source, rel), profile);
            for (const a of ranked) {
                advice.push({ file: rel, ...a });
            }
            if (opts.apply) {
                const result = (0, optimizer_apply_js_1.applyOptimizerHints)(source, rel, profile, {
                    layout: opts.layout === true,
                    useBuffer: opts.buffer === true,
                    projectRoot: root,
                });
                if (result.changed) {
                    node_fs_1.default.writeFileSync(file, result.source, "utf8");
                    appliedCount += result.applied.length;
                    console.error(`cluaupp optimize --apply: ${rel}: ${result.applied.join(", ")}`);
                }
            }
        }
        if (opts.apply && opts.layout) {
            const plans = (0, optimizer_soa_js_1.collectSoaPlansFromProject)(root);
            (0, optimizer_soa_js_1.writeSoaArtifacts)(root, plans, { useBuffer: opts.buffer === true });
        }
        if (opts.apply) {
            console.error(`cluaupp optimize --apply: ${appliedCount} hint(s)`);
        }
        console.log(JSON.stringify(advice, null, "\t"));
    });
    program
        .command("bridge")
        .description("Studio↔IDE HTTP bridge (default :3847) — Open IDE from CluauppNav plugin")
        .argument("[folder]", "game root", ".")
        .option("-p, --port <n>", "Port", String(studio_bridge_js_1.BRIDGE_DEFAULT_PORT))
        .action((folder, opts) => {
        const root = node_path_1.default.resolve(folder);
        const port = Number(opts.port) || studio_bridge_js_1.BRIDGE_DEFAULT_PORT;
        const server = (0, studio_bridge_js_1.startStudioBridge)({
            port,
            projectRoot: root,
            onEvent: (ev) => {
                console.log(`cluaupp bridge: ${ev.type}`, ev.path || ev.message || "", ev.line ? `:${ev.line}` : "");
            },
        });
        console.log(`cluaupp bridge: http://127.0.0.1:${server.port} (project ${root})`);
        console.log("Keep this process running. Studio plugin → Open IDE / errors POST here.");
    });
    program
        .command("profile")
        .description("PGO: write template, or ingest Studio/playtest JSONL into cluaupp.profile.json")
        .argument("[folder]", "game root", ".")
        .option("--ingest <file>", "Merge JSON/JSONL profile events into cluaupp.profile.json")
        .action((folder, opts) => {
        const root = node_path_1.default.resolve(folder);
        if (opts.ingest) {
            const { profilePath, merged, profile } = (0, index_js_1.ingestProfile)(root, opts.ingest);
            console.log(`cluaupp profile ingest: ${merged} event(s) → ${profilePath}`);
            console.log(JSON.stringify({ hot: profile.hot, structs: profile.structs }, null, "\t"));
            return;
        }
        const file = (0, pgo_js_1.writeProfileTemplate)(root);
        console.log("cluaupp profile:", file);
    });
    program
        .command("check-authority")
        .description("Authority rules + call-graph (CLUAU-AUTH*)")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        const root = node_path_1.default.resolve(folder);
        const src = node_path_1.default.join(root, "src");
        const files = node_fs_1.default.existsSync(src) ? (0, paths_js_1.collectSources)(src) : [];
        const policy = (0, index_js_1.loadPlatformPolicy)(root);
        const all = [...(0, index_js_1.checkAuthorityGraph)(root, "src", policy)];
        for (const file of files) {
            const rel = node_path_1.default.relative(root, file).replace(/\\/g, "/");
            all.push(...(0, index_js_1.checkAuthority)(node_fs_1.default.readFileSync(file, "utf8"), rel, policy));
        }
        console.log(JSON.stringify(all, null, "\t"));
        if (all.some((d) => d.severity === "error"))
            process.exit(1);
    });
    program
        .command("docs")
        .description("Generate .cluaupp/PROJECT.md from DataModel + graph + Flare + optimizer advice")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        const { outPath } = (0, project_docs_js_1.generateProjectDocs)(node_path_1.default.resolve(folder));
        console.log("cluaupp docs:", outPath);
    });
    program
        .command("security")
        .description("Static security pattern scan (warnings)")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        const root = node_path_1.default.resolve(folder);
        const src = node_path_1.default.join(root, "src");
        const files = node_fs_1.default.existsSync(src) ? (0, paths_js_1.collectSources)(src) : [];
        const all = [];
        for (const file of files) {
            const rel = node_path_1.default.relative(root, file).replace(/\\/g, "/");
            all.push(...(0, index_js_1.checkSecurity)(node_fs_1.default.readFileSync(file, "utf8"), rel));
        }
        console.log(JSON.stringify(all, null, "\t"));
    });
    program
        .command("analyze")
        .description("Alias of target doctor (full platform analysis)")
        .argument("[folder]", "game root", ".")
        .action((folder) => {
        const report = (0, index_js_1.runDoctor)(node_path_1.default.resolve(folder));
        console.log(JSON.stringify(report, null, "\t"));
        if (!report.ok)
            process.exit(1);
    });
    program
        .command("add")
        .description("Thin Wally wrapper: runs `wally add` when wally is on PATH")
        .argument("<package>", "wally package spec")
        .action((pkgName) => {
        const r = (0, node_child_process_1.spawnSync)("wally", ["add", pkgName], { stdio: "inherit", shell: true });
        if (r.error || (r.status ?? 1) !== 0) {
            console.error("cluaupp add: install Wally and retry, or edit wally.toml by hand");
            process.exit(r.status ?? 1);
        }
    });
}
function runGenerate(dump, skipHeaders, skipLuau, skipDocs = true) {
    const started = Date.now();
    const result = (0, index_js_1.generateAll)({ dumpPath: dump, skipHeaders, skipLuau, skipDocs });
    console.log(`cluaupp api generate: schema v${result.profile.schemaVersion}, ${Object.keys(result.profile.classes).length} classes, ${Object.keys(result.profile.enums).length} enums, ${Object.keys(result.profile.datatypes).length} datatypes (${Date.now() - started}ms)`);
    console.log("manifest:", result.manifestPath);
    console.log("lock:", result.lockPath);
    if (result.lspIndexPath) {
        console.log("lsp-index:", result.lspIndexPath);
    }
}
