"use strict";
/**
 * Incremental compile cache + bounded parallel job runner.
 * Cache lives under `.cluaupp/compile-cache/` (gitignored via `.cluaupp/`).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPILE_CACHE_SCHEMA = void 0;
exports.compileCacheDir = compileCacheDir;
exports.hashText = hashText;
exports.fingerprintSource = fingerprintSource;
exports.loadCompileCacheIndex = loadCompileCacheIndex;
exports.saveCompileCacheIndex = saveCompileCacheIndex;
exports.readCachedJob = readCachedJob;
exports.writeCachedJob = writeCachedJob;
exports.mapPool = mapPool;
exports.defaultJobCount = defaultJobCount;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
exports.COMPILE_CACHE_SCHEMA = 1;
function compileCacheDir(projectRoot) {
    return node_path_1.default.join(projectRoot, ".cluaupp", "compile-cache");
}
function hashText(text) {
    return node_crypto_1.default.createHash("sha256").update(text, "utf8").digest("hex");
}
function fingerprintSource(source, configKey) {
    return hashText(`${configKey}\n${source}`);
}
function indexPath(projectRoot) {
    return node_path_1.default.join(compileCacheDir(projectRoot), "index.json");
}
function jobPath(projectRoot, rel) {
    const safe = rel.replace(/[\\/]/g, "__");
    return node_path_1.default.join(compileCacheDir(projectRoot), `${safe}.json`);
}
function loadCompileCacheIndex(projectRoot) {
    const file = indexPath(projectRoot);
    if (!node_fs_1.default.existsSync(file)) {
        return { schemaVersion: exports.COMPILE_CACHE_SCHEMA, entries: {} };
    }
    try {
        const raw = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
        if (!raw || typeof raw.entries !== "object") {
            return { schemaVersion: exports.COMPILE_CACHE_SCHEMA, entries: {} };
        }
        return { schemaVersion: exports.COMPILE_CACHE_SCHEMA, entries: raw.entries };
    }
    catch {
        return { schemaVersion: exports.COMPILE_CACHE_SCHEMA, entries: {} };
    }
}
function saveCompileCacheIndex(projectRoot, index) {
    const dir = compileCacheDir(projectRoot);
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    node_fs_1.default.writeFileSync(indexPath(projectRoot), JSON.stringify(index, null, "\t") + "\n", "utf8");
}
function readCachedJob(projectRoot, rel, sourceHash) {
    const index = loadCompileCacheIndex(projectRoot);
    if (index.entries[rel] !== sourceHash) {
        return null;
    }
    const file = jobPath(projectRoot, rel);
    if (!node_fs_1.default.existsSync(file)) {
        return null;
    }
    try {
        const job = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
        if (!job || job.sourceHash !== sourceHash || !Array.isArray(job.files)) {
            return null;
        }
        return job;
    }
    catch {
        return null;
    }
}
function writeCachedJob(projectRoot, job) {
    const dir = compileCacheDir(projectRoot);
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    node_fs_1.default.writeFileSync(jobPath(projectRoot, job.rel), JSON.stringify(job) + "\n", "utf8");
    const index = loadCompileCacheIndex(projectRoot);
    index.entries[job.rel] = job.sourceHash;
    saveCompileCacheIndex(projectRoot, index);
}
/** Bounded concurrency over async work items. */
async function mapPool(items, concurrency, fn) {
    const limit = Math.max(1, Math.min(concurrency, items.length || 1));
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
        while (true) {
            const i = next++;
            if (i >= items.length)
                return;
            results[i] = await fn(items[i], i);
        }
    }
    await Promise.all(Array.from({ length: limit }, () => worker()));
    return results;
}
function defaultJobCount() {
    const env = Number(process.env.CLUAUPP_JOBS || process.env.CLPP_JOBS || "");
    if (Number.isFinite(env) && env > 0) {
        return Math.floor(env);
    }
    return Math.max(1, Math.min(8, node_os_1.default.cpus()?.length || 4));
}
