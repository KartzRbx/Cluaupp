"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectSourcesFiles = void 0;
exports.loadConfig = loadConfig;
exports.collectCpp = collectCpp;
exports.build = build;
exports.buildAsync = buildAsync;
exports.init = init;
exports.watch = watch;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const postprocess_js_1 = require("../clpp/postprocess.js");
const paths_js_1 = require("../clpp/paths.js");
const index_js_1 = require("../flare/index.js");
const index_js_2 = require("../native/index.js");
const intellisense_js_1 = require("../intellisense.js");
const process_orchestrator_js_1 = require("./process-orchestrator.js");
const rojo_mapper_js_1 = require("./rojo-mapper.js");
const transpile_js_1 = require("../transpile.js");
const safe_paths_js_1 = require("./safe-paths.js");
const source_map_js_1 = require("../target/source-map.js");
const luau_stamp_js_1 = require("../target/luau-stamp.js");
const optimizer_soa_js_1 = require("../target/optimizer-soa.js");
const index_js_3 = require("../api/index.js");
const flare_version_js_1 = require("../target/flare-version.js");
const component_contracts_js_1 = require("../target/component-contracts.js");
const authority_check_js_1 = require("../target/authority-check.js");
const datamodel_js_1 = require("../target/datamodel.js");
const build_cache_js_1 = require("../target/build-cache.js");
const modules_js_1 = require("../clpp/modules.js");
function readProjectConfig(file) {
    const raw = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }
    const data = raw;
    const parsed = {};
    if (typeof data.rootDir === "string") {
        parsed.rootDir = data.rootDir;
    }
    if (typeof data.outDir === "string") {
        parsed.outDir = data.outDir;
    }
    if (typeof data.strict === "boolean") {
        parsed.strict = data.strict;
    }
    if (typeof data.architecture === "boolean") {
        parsed.architecture = data.architecture;
    }
    if (data.rules && typeof data.rules === "object") {
        parsed.rules = data.rules;
    }
    if (Array.isArray(data.components)) {
        parsed.components = data.components;
    }
    return parsed;
}
function loadConfig(root) {
    const defaults = { rootDir: "src", outDir: "out", strict: false, architecture: false };
    const configNames = ["cluaupp.config.json", "cluau.config.json"];
    let parsed = {};
    for (const name of configNames) {
        const file = node_path_1.default.join(root, name);
        if (node_fs_1.default.existsSync(file)) {
            parsed = readProjectConfig(file);
            break;
        }
    }
    const config = {
        ...defaults,
        ...parsed,
        rootDir: (0, safe_paths_js_1.safeProjectSubdir)(parsed.rootDir || defaults.rootDir, defaults.rootDir, "rootDir"),
        outDir: (0, safe_paths_js_1.safeProjectSubdir)(parsed.outDir || defaults.outDir, defaults.outDir, "outDir"),
    };
    if (config.rootDir === config.outDir) {
        throw new Error("cluaupp: rootDir and outDir must be different");
    }
    const absRoot = node_path_1.default.resolve(root);
    (0, safe_paths_js_1.assertInside)(absRoot, node_path_1.default.join(absRoot, config.rootDir), "rootDir");
    (0, safe_paths_js_1.assertInside)(absRoot, node_path_1.default.join(absRoot, config.outDir), "outDir");
    return config;
}
function copyDir(from, to) {
    node_fs_1.default.mkdirSync(to, { recursive: true });
    for (const entry of node_fs_1.default.readdirSync(from, { withFileTypes: true })) {
        const src = node_path_1.default.join(from, entry.name);
        const dest = node_path_1.default.join(to, entry.name);
        if (entry.isDirectory()) {
            copyDir(src, dest);
        }
        else {
            node_fs_1.default.copyFileSync(src, dest);
        }
    }
}
function tryRm(target, root) {
    if (root && !(0, safe_paths_js_1.isInside)(root, target)) {
        console.error("cluaupp: skip remove outside project", target);
        return false;
    }
    try {
        node_fs_1.default.rmSync(target, { recursive: true, force: true });
        return true;
    }
    catch (err) {
        const error = err;
        if (error.code === "EPERM" || error.code === "EBUSY" || error.code === "ENOTEMPTY") {
            console.error("cluaupp: skip remove", target, `(${error.code})`);
            return false;
        }
        throw err;
    }
}
function copyFileIfChanged(src, dest, mode = "fill") {
    if (mode !== "force") {
        if (mode === "fill" && node_fs_1.default.existsSync(dest)) {
            return;
        }
        if (mode === "update" && node_fs_1.default.existsSync(dest)) {
            const from = node_fs_1.default.statSync(src);
            const to = node_fs_1.default.statSync(dest);
            if (from.size === to.size && from.mtimeMs <= to.mtimeMs) {
                return;
            }
        }
    }
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(dest), { recursive: true });
    try {
        node_fs_1.default.copyFileSync(src, dest);
    }
    catch (err) {
        const error = err;
        if (error.code === "EPERM" || error.code === "EBUSY") {
            console.error("cluaupp: skip copy", dest, `(${error.code})`);
            return;
        }
        throw err;
    }
}
function syncDir(from, to, mode = "fill") {
    if (!node_fs_1.default.existsSync(from)) {
        return;
    }
    node_fs_1.default.mkdirSync(to, { recursive: true });
    for (const entry of node_fs_1.default.readdirSync(from, { withFileTypes: true })) {
        const src = node_path_1.default.join(from, entry.name);
        const dest = node_path_1.default.join(to, entry.name);
        if (entry.isDirectory()) {
            syncDir(src, dest, mode);
        }
        else {
            copyFileIfChanged(src, dest, mode);
        }
    }
}
function pruneStaleLibs(libs) {
    if (!node_fs_1.default.existsSync(libs)) {
        return;
    }
    const staleNames = [
        "Janitor",
        "Signal",
        "MathUtils",
        "FormatNumber",
        "Module3D",
        "Twinkle",
        "EzVisualz",
        "Spring",
        "Display",
        "StickyBillboard",
        "Icon",
        "TopbarPlus",
        "Cmdr",
        "Chrono",
        "Iris",
        "Fusion",
        "StateMachine",
        "VfxUtil",
        "DataService",
        "TutorialKit",
        "TutorialServer",
        "QuickNet",
    ];
    const stale = [
        ...staleNames.map((name) => node_path_1.default.join(libs, name)),
        node_path_1.default.join(libs, "Keep", "Packages"),
        node_path_1.default.join(libs, "Keep", "ProfileStore.luau"),
    ];
    for (const target of stale) {
        if (!node_fs_1.default.existsSync(target)) {
            continue;
        }
        node_fs_1.default.rmSync(target, { recursive: true, force: true });
    }
}
function copyRuntime(dest) {
    const runtime = node_path_1.default.join(__dirname, "..", "..", "runtime");
    if (!node_fs_1.default.existsSync(runtime)) {
        return;
    }
    const libs = node_path_1.default.join(dest, "libs");
    pruneStaleLibs(libs);
    syncDir(runtime, libs, "force");
}
function copyHeaders(dest) {
    const from = node_path_1.default.join(__dirname, "..", "..", "include", "clpp");
    if (!node_fs_1.default.existsSync(from)) {
        return;
    }
    syncDir(from, node_path_1.default.join(dest, "include", "clpp"));
}
function collectCpp(dir, files = []) {
    return (0, paths_js_1.collectSources)(dir, files);
}
exports.collectSourcesFiles = paths_js_1.collectSources;
function collectFiles(dir, files = []) {
    if (!node_fs_1.default.existsSync(dir)) {
        return files;
    }
    for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
        const full = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectFiles(full, files);
        }
        else {
            files.push(full);
        }
    }
    return files;
}
function resolveKey(file) {
    const resolved = node_path_1.default.resolve(file);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}
function posixRel(from, file) {
    return node_path_1.default.relative(from, file).replace(/\\/g, "/");
}
function sourcePrefixes(rel) {
    const noExt = rel.replace(/\.(clpp|clp|clh)$/i, "");
    const noTag = noExt.replace(/\.(server|client)$/i, "");
    return [...new Set([noExt, noTag, (0, paths_js_1.toLuauPath)(rel).replace(/\\/g, "/")])];
}
function matchesPrefix(relOut, prefixes) {
    const n = relOut.replace(/\\/g, "/").toLowerCase();
    return prefixes.some((prefix) => {
        const key = prefix.replace(/\\/g, "/").toLowerCase();
        return n === key || n === `${key}.luau` || n.startsWith(`${key}/`) || n.startsWith(`${key}.`);
    });
}
function removeEmptyOutDirs(outDir, projectRootDir) {
    if (!node_fs_1.default.existsSync(outDir)) {
        return;
    }
    const walk = (dir) => {
        if (resolveKey(dir) === resolveKey(outDir)) {
            for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
                if (entry.isDirectory()) {
                    walk(node_path_1.default.join(dir, entry.name));
                }
            }
            return;
        }
        for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                walk(node_path_1.default.join(dir, entry.name));
            }
        }
        if (node_fs_1.default.existsSync(dir) && node_fs_1.default.readdirSync(dir).length === 0) {
            if (tryRm(dir, projectRootDir)) {
                console.log("cluaupp: removed", node_path_1.default.relative(projectRootDir, dir));
            }
        }
    };
    walk(outDir);
}
function pruneOut(root, config, written, failedPrefixes) {
    const outDir = node_path_1.default.resolve(root, config.outDir);
    if (!node_fs_1.default.existsSync(outDir) || !(0, safe_paths_js_1.isInside)(root, outDir)) {
        return;
    }
    for (const file of collectFiles(outDir)) {
        if (written.has(resolveKey(file))) {
            continue;
        }
        if (!(0, safe_paths_js_1.isInside)(outDir, file)) {
            continue;
        }
        const rel = posixRel(outDir, file);
        if (matchesPrefix(rel, failedPrefixes)) {
            continue;
        }
        if (tryRm(file, outDir)) {
            console.log("cluaupp: removed", node_path_1.default.relative(root, file));
        }
    }
    removeEmptyOutDirs(outDir, root);
}
function createMapper(root, config, rojoPath) {
    const projectJson = node_path_1.default.resolve(root, rojoPath || "default.project.json");
    const mapper = new rojo_mapper_js_1.RojoMapper(projectJson, node_path_1.default.join(root, config.rootDir), config.outDir);
    mapper.loadSync();
    return mapper;
}
function compileOptions(root, config, file, rel) {
    const srcDir = node_path_1.default.join(root, config.rootDir);
    return {
        ...config,
        filePath: file,
        relativeName: rel,
        outName: (0, paths_js_1.toLuauPath)(rel),
        architecture: config.architecture === true,
        includeDirs: [node_path_1.default.dirname(file), srcDir, node_path_1.default.join(root, "include")],
        srcDir,
        outDir: config.outDir,
    };
}
function compileSchemaJobs(root, config, srcDir) {
    const jobs = [];
    const errors = [];
    const flare = compileFlareJobs(root, config, srcDir);
    jobs.push(...flare.jobs);
    errors.push(...flare.errors);
    for (const file of (0, index_js_2.collectNativeSchemaFiles)(srcDir)) {
        const rel = posixRel(srcDir, file);
        try {
            const emit = (0, index_js_2.compileNativeSchemaFile)(file, srcDir);
            const headerDest = node_path_1.default.join(srcDir, emit.headerRel);
            if (!(0, safe_paths_js_1.isInside)(node_path_1.default.resolve(root, config.rootDir), headerDest) && !(0, safe_paths_js_1.isInside)(srcDir, headerDest)) {
                throw new Error(`cluaupp schema: skip unsafe header ${emit.headerRel}`);
            }
            writeTextIfChanged(headerDest, emit.header);
            jobs.push({
                rel,
                files: [{ name: emit.luauRel, contents: emit.luau }],
                stale: [],
            });
        }
        catch (err) {
            errors.push({
                rel,
                prefixes: sourcePrefixes(rel.replace(/\.(mint|bloom|helm|shift|hive|axiom)$/i, ".clh")),
                message: err.message,
            });
        }
    }
    return { jobs, errors };
}
function compileFlareJobs(root, config, srcDir) {
    const jobs = [];
    const errors = [];
    for (const file of (0, index_js_1.collectFlareFiles)(srcDir)) {
        const rel = posixRel(srcDir, file);
        try {
            const { emit } = (0, index_js_1.compileFlareFile)(file, srcDir);
            const headerDest = node_path_1.default.join(srcDir, emit.headerRel);
            if (!(0, safe_paths_js_1.isInside)(node_path_1.default.resolve(root, config.rootDir), headerDest) && !(0, safe_paths_js_1.isInside)(srcDir, headerDest)) {
                throw new Error(`cluaupp flare: skip unsafe header ${emit.headerRel}`);
            }
            writeTextIfChanged(headerDest, emit.header);
            jobs.push({
                rel,
                files: [{ name: emit.luauRel, contents: emit.luau }],
                stale: [],
            });
        }
        catch (err) {
            errors.push({ rel, prefixes: sourcePrefixes(rel.replace(/\.flare$/i, ".clh")), message: err.message });
        }
    }
    return { jobs, errors };
}
function configFingerprint(config) {
    return JSON.stringify({
        strict: config.strict === true,
        architecture: config.architecture === true,
        rootDir: config.rootDir,
        outDir: config.outDir,
        v: package_info_js_1.pkg.version,
    });
}
function compileProject(root, config, mapper, options = {}) {
    const srcDir = node_path_1.default.join(root, config.rootDir);
    const schema = compileSchemaJobs(root, config, srcDir);
    const files = (0, paths_js_1.collectSources)(srcDir);
    const jobs = [...schema.jobs];
    const errors = [...schema.errors];
    const incremental = options.incremental !== false;
    const cfgKey = configFingerprint(config);
    let cacheHits = 0;
    for (const file of files) {
        const source = node_fs_1.default.readFileSync(file, "utf8");
        const rel = posixRel(srcDir, file);
        const sourceHash = (0, modules_js_1.fingerprintSourceWithDeps)(source, file, cfgKey, srcDir, build_cache_js_1.hashText);
        try {
            if (incremental) {
                const cached = (0, build_cache_js_1.readCachedJob)(root, rel, sourceHash);
                if (cached) {
                    jobs.push({ rel, files: cached.files, stale: cached.stale || [] });
                    cacheHits++;
                    continue;
                }
            }
            const result = (0, transpile_js_1.transpileSource)(source, rel, compileOptions(root, config, file, rel), mapper);
            jobs.push({ rel, files: result.files, stale: result.stale || [] });
            if (incremental) {
                (0, build_cache_js_1.writeCachedJob)(root, {
                    rel,
                    sourceHash,
                    files: result.files,
                    stale: result.stale || [],
                });
            }
        }
        catch (err) {
            errors.push({ rel, prefixes: sourcePrefixes(rel), message: err.message });
        }
    }
    if (cacheHits > 0) {
        console.log(`cluaupp: incremental cache hit ${cacheHits}/${files.length}`);
    }
    return { files, jobs, errors };
}
async function compileProjectAsync(root, config, mapper, options = {}) {
    const srcDir = node_path_1.default.join(root, config.rootDir);
    const schema = compileSchemaJobs(root, config, srcDir);
    const files = (0, paths_js_1.collectSources)(srcDir);
    const jobs = [...schema.jobs];
    const errors = [...schema.errors];
    const incremental = options.incremental !== false;
    const cfgKey = configFingerprint(config);
    const concurrency = options.jobs ?? (0, build_cache_js_1.defaultJobCount)();
    let cacheHits = 0;
    const compiled = await (0, build_cache_js_1.mapPool)(files, concurrency, async (file) => {
        const source = node_fs_1.default.readFileSync(file, "utf8");
        const rel = posixRel(srcDir, file);
        const sourceHash = (0, modules_js_1.fingerprintSourceWithDeps)(source, file, cfgKey, srcDir, build_cache_js_1.hashText);
        try {
            if (incremental) {
                const cached = (0, build_cache_js_1.readCachedJob)(root, rel, sourceHash);
                if (cached) {
                    return {
                        ok: true,
                        rel,
                        files: cached.files,
                        stale: cached.stale || [],
                        cached: true,
                        sourceHash,
                    };
                }
            }
            const result = await (0, transpile_js_1.transpileSourceAsync)(source, rel, compileOptions(root, config, file, rel), mapper);
            return {
                ok: true,
                rel,
                files: result.files,
                stale: result.stale || [],
                cached: false,
                sourceHash,
            };
        }
        catch (err) {
            return {
                ok: false,
                rel,
                prefixes: sourcePrefixes(rel),
                message: err.message,
            };
        }
    });
    for (const item of compiled) {
        if (item.ok) {
            jobs.push({ rel: item.rel, files: item.files, stale: item.stale });
            if (item.cached) {
                cacheHits++;
            }
            else if (incremental) {
                (0, build_cache_js_1.writeCachedJob)(root, {
                    rel: item.rel,
                    sourceHash: item.sourceHash,
                    files: item.files,
                    stale: item.stale,
                });
            }
        }
        else {
            errors.push({ rel: item.rel, prefixes: item.prefixes, message: item.message });
        }
    }
    if (cacheHits > 0) {
        console.log(`cluaupp: incremental cache hit ${cacheHits}/${files.length} (jobs=${concurrency})`);
    }
    else if (files.length > 1 && concurrency > 1) {
        console.log(`cluaupp: parallel compile jobs=${concurrency}`);
    }
    return { files, jobs, errors };
}
function writeTextIfChanged(dest, contents) {
    if (node_fs_1.default.existsSync(dest) && node_fs_1.default.readFileSync(dest, "utf8") === contents) {
        return false;
    }
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(dest), { recursive: true });
    node_fs_1.default.writeFileSync(dest, contents, "utf8");
    return true;
}
function outDest(root, config, rel) {
    const safe = (0, safe_paths_js_1.safeRelPath)(rel);
    if (!safe) {
        console.error("cluaupp: skip unsafe out path", rel);
        return null;
    }
    const outRoot = node_path_1.default.resolve(root, config.outDir);
    const dest = node_path_1.default.join(outRoot, safe);
    if (!(0, safe_paths_js_1.isInside)(outRoot, dest) || !(0, safe_paths_js_1.isInside)(root, dest)) {
        console.error("cluaupp: skip unsafe out path", rel);
        return null;
    }
    return dest;
}
function writeJobs(root, config, jobs, format) {
    const written = new Set();
    for (const job of jobs) {
        for (const artifact of job.files) {
            const dest = outDest(root, config, artifact.name);
            if (!dest) {
                continue;
            }
            let contents = artifact.contents;
            if (/\.luau$/i.test(dest)) {
                const srcFile = node_path_1.default.join(root, config.rootDir, job.rel);
                const clppSource = node_fs_1.default.existsSync(srcFile) ? node_fs_1.default.readFileSync(srcFile, "utf8") : undefined;
                contents = (0, luau_stamp_js_1.stampLuauFromClpp)((0, postprocess_js_1.rewriteClppEmit)(contents), job.rel, clppSource);
            }
            const changed = writeTextIfChanged(dest, contents);
            written.add(resolveKey(dest));
            if (changed) {
                console.log("cluaupp:", job.rel, "→", node_path_1.default.relative(root, dest));
            }
            if (/\.luau$/i.test(dest)) {
                const mapPath = (0, source_map_js_1.writeSourceMap)({
                    outLuauPath: dest,
                    sourceClppRel: job.rel,
                    projectRoot: root,
                });
                written.add(resolveKey(mapPath));
            }
            if (format && /\.luau$/i.test(dest)) {
                process_orchestrator_js_1.ProcessOrchestrator.formatWithStyLuaSync(dest);
            }
        }
        for (const stale of job.stale || []) {
            const dest = outDest(root, config, stale);
            if (dest && node_fs_1.default.existsSync(dest) && !written.has(resolveKey(dest))) {
                if (tryRm(dest, node_path_1.default.resolve(root, config.outDir))) {
                    console.log("cluaupp: removed", node_path_1.default.relative(root, dest));
                }
            }
        }
    }
    return written;
}
function ensureVendor(root) {
    copyRuntime(root);
    copyHeaders(root);
}
function finishBuild(root, config, compiled, options) {
    const exitOnError = options.exitOnError !== false;
    const holdOnError = options.holdOnError === true;
    const format = options.format === true;
    if (compiled.errors.length > 0) {
        for (const err of compiled.errors) {
            console.error(err.message);
        }
        if (holdOnError) {
            console.error(`cluaupp: out not updated (${compiled.errors.length} compile error${compiled.errors.length === 1 ? "" : "s"})`);
            try {
                (0, intellisense_js_1.syncEditorSupport)(root, config);
            }
            catch (err) {
                console.error("cluaupp: intellisense sync failed", err.message);
            }
            return { failed: compiled.errors.length, written: new Set() };
        }
    }
    const written = writeJobs(root, config, compiled.jobs, format);
    try {
        const soaPlans = (0, optimizer_soa_js_1.collectSoaPlansFromProject)(root, config.rootDir);
        if (soaPlans.length) {
            const files = (0, optimizer_soa_js_1.writeSoaArtifacts)(root, soaPlans, { useBuffer: false });
            for (const f of files) {
                console.log("cluaupp: SoA", node_path_1.default.relative(root, f));
            }
        }
    }
    catch (err) {
        console.error("cluaupp: SoA emit failed", err.message);
    }
    const failedPrefixes = compiled.errors.flatMap((err) => err.prefixes);
    pruneOut(root, config, written, failedPrefixes);
    try {
        (0, intellisense_js_1.syncEditorSupport)(root, config);
    }
    catch (err) {
        console.error("cluaupp: intellisense sync failed", err.message);
    }
    if (options.analyze) {
        for (const file of written) {
            if (/\.luau$/i.test(file)) {
                const report = process_orchestrator_js_1.ProcessOrchestrator.analyzeWithLuauSync(file);
                if (report) {
                    console.log("\n📊 Relatório de Análise Estática do Luau:\n", report);
                }
            }
        }
    }
    if (compiled.errors.length > 0 && exitOnError) {
        process.exit(1);
    }
    return { failed: compiled.errors.length, written };
}
function prepareBuild(root, options) {
    const exitOnError = options.exitOnError !== false;
    const holdOnError = options.holdOnError === true;
    const config = loadConfig(root);
    if (options.strict === true) {
        config.strict = true;
    }
    if (options.syncVendor !== false) {
        ensureVendor(root);
    }
    const srcDir = node_path_1.default.join(root, config.rootDir);
    if (!node_fs_1.default.existsSync(srcDir) || (0, paths_js_1.collectSources)(srcDir).length === 0) {
        console.error("no .clpp/.clp/.clh files in", config.rootDir);
        if (!holdOnError) {
            pruneOut(root, config, new Set(), []);
        }
        if (exitOnError) {
            process.exit(1);
        }
        return null;
    }
    return { config, mapper: createMapper(root, config, options.rojo) };
}
function enforceFrozen(root, config) {
    const lock = (0, index_js_3.verifyLock)();
    if (!lock.ok) {
        throw new Error(`cluaupp build --frozen: API lock failed\n${lock.messages.join("\n")}`);
    }
    const flare = (0, flare_version_js_1.checkFlareVersions)(root, config.rootDir);
    if (flare.conflicts.length) {
        throw new Error(`cluaupp build --frozen: Flare version conflicts\n${flare.conflicts.map((c) => c.message).join("\n")}`);
    }
    const policy = (0, authority_check_js_1.loadPlatformPolicy)(root);
    const components = config.components || policy.components || [];
    if (components.length) {
        const dm = (0, datamodel_js_1.buildDatamodelProfile)(root);
        if (dm) {
            const bad = (0, component_contracts_js_1.checkComponentContracts)(dm, components).filter((d) => d.severity === "error");
            if (bad.length) {
                throw new Error(`cluaupp build --frozen: component contracts\n${bad.map((b) => b.message).join("\n")}`);
            }
        }
    }
}
function build(root, options = {}) {
    if (options.frozen) {
        const config = loadConfig(root);
        enforceFrozen(root, config);
    }
    const prepared = prepareBuild(root, options);
    if (!prepared) {
        return { failed: 0, written: new Set() };
    }
    const compiled = compileProject(root, prepared.config, prepared.mapper, options);
    return finishBuild(root, prepared.config, compiled, options);
}
async function buildAsync(root, options = {}) {
    if (options.frozen) {
        const config = loadConfig(root);
        enforceFrozen(root, config);
    }
    const prepared = prepareBuild(root, options);
    if (!prepared) {
        return { failed: 0, written: new Set() };
    }
    const compiled = await compileProjectAsync(root, prepared.config, prepared.mapper, options);
    return finishBuild(root, prepared.config, compiled, options);
}
async function init(dest) {
    const target = (0, safe_paths_js_1.assertInitDest)(dest);
    const template = node_path_1.default.join(__dirname, "..", "..", "templates", "game");
    const include = node_path_1.default.join(__dirname, "..", "..", "include");
    copyDir(template, target);
    copyDir(include, node_path_1.default.join(target, "include"));
    const skills = node_path_1.default.join(__dirname, "..", "..", "skills");
    if (node_fs_1.default.existsSync(skills)) {
        copyDir(skills, node_path_1.default.join(target, ".cursor", "skills"));
    }
    copyRuntime(target);
    (0, intellisense_js_1.syncEditorSupport)(target);
    try {
        (0, intellisense_js_1.installEditorExtension)();
    }
    catch {
        // editor homes may be missing in CI
    }
    console.log("Cluaupp ready in", target);
    console.log("  clpp install          (CL++ highlighting + IntelliSense)");
    console.log("  cluaupp intellisense  (schema .flare .hive .mint .bloom .helm .shift .axiom)");
    console.log("  rokit install");
    console.log("  cluaupp build");
    console.log("  rojo serve");
}
function pidAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
function acquireWatchLock(root) {
    const file = node_path_1.default.join(root, ".cluaupp-watch.lock");
    if (node_fs_1.default.existsSync(file)) {
        const pid = Number(node_fs_1.default.readFileSync(file, "utf8").trim());
        if (Number.isFinite(pid) && pid !== process.pid && pidAlive(pid)) {
            console.error(`cluaupp: watch already running (pid ${pid}). Stop it first — two watchers make Rojo crash on libs/.`);
            process.exit(1);
        }
    }
    node_fs_1.default.writeFileSync(file, String(process.pid), "utf8");
    const release = () => {
        try {
            if (node_fs_1.default.existsSync(file) && node_fs_1.default.readFileSync(file, "utf8").trim() === String(process.pid)) {
                node_fs_1.default.unlinkSync(file);
            }
        }
        catch {
            // ignore
        }
    };
    process.on("exit", release);
    process.on("SIGINT", () => {
        release();
        process.exit(0);
    });
    process.on("SIGTERM", () => {
        release();
        process.exit(0);
    });
}
function watch(root, options = {}) {
    acquireWatchLock(root);
    const config = loadConfig(root);
    const dir = node_path_1.default.join(root, config.rootDir);
    let timer = null;
    let running = false;
    let queued = false;
    const run = () => {
        if (running) {
            queued = true;
            return;
        }
        running = true;
        void buildAsync(root, { exitOnError: false, syncVendor: false, holdOnError: true, format: options.format, rojo: options.rojo })
            .catch((err) => {
            console.error(err.message);
        })
            .finally(() => {
            running = false;
            if (queued) {
                queued = false;
                run();
            }
        });
    };
    console.log("cluaupp", package_info_js_1.pkg.version, "watching", dir, "(libs untouched)");
    if (!node_fs_1.default.existsSync(dir)) {
        node_fs_1.default.mkdirSync(dir, { recursive: true });
    }
    run();
    node_fs_1.default.watch(dir, { recursive: true }, () => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(run, 400);
    });
}
