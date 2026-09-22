"use strict";
/**
 * Profile-Guided Optimization (PGO) — format, load, Studio ingest.
 * cluaupp.profile.json weights optimizer advice toward hot symbols.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGO_SCHEMA_VERSION = void 0;
exports.defaultProfilePath = defaultProfilePath;
exports.loadProfile = loadProfile;
exports.writeProfileTemplate = writeProfileTemplate;
exports.ingestProfile = ingestProfile;
exports.rankAdvice = rankAdvice;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
exports.PGO_SCHEMA_VERSION = 1;
function defaultProfilePath(projectRoot) {
    return node_path_1.default.join(projectRoot, "cluaupp.profile.json");
}
function loadProfile(file) {
    if (!node_fs_1.default.existsSync(file)) {
        return null;
    }
    try {
        const raw = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
        if (!raw || typeof raw.hot !== "object") {
            return null;
        }
        return { schemaVersion: exports.PGO_SCHEMA_VERSION, hot: raw.hot, structs: raw.structs, generatedAt: raw.generatedAt };
    }
    catch {
        return null;
    }
}
/** Write an empty / template profile for games to fill from Studio logging. */
function writeProfileTemplate(projectRoot) {
    const file = defaultProfilePath(projectRoot);
    const template = {
        schemaVersion: exports.PGO_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        hot: {
            CalculateDamage: 0,
            EnemyUpdate: 0,
        },
        structs: {
            EnemyState: 0,
        },
    };
    node_fs_1.default.writeFileSync(file, JSON.stringify(template, null, "\t") + "\n", "utf8");
    return file;
}
function parseEvents(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return [];
    if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed);
        if (!Array.isArray(arr))
            return [];
        return arr.filter((e) => e && typeof e.symbol === "string");
    }
    if (trimmed.startsWith("{") && !trimmed.includes("\n")) {
        const one = JSON.parse(trimmed);
        if (typeof one.symbol === "string") {
            return [one];
        }
        if (one.hot && typeof one.hot === "object") {
            return Object.entries(one.hot).map(([symbol, count]) => ({
                symbol,
                kind: "hot",
                count: Number(count) || 0,
            }));
        }
    }
    const events = [];
    for (const line of trimmed.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith("#"))
            continue;
        try {
            const e = JSON.parse(t);
            if (e && typeof e.symbol === "string")
                events.push(e);
        }
        catch {
            /* skip bad line */
        }
    }
    return events;
}
/** Merge Studio/playtest events into cluaupp.profile.json (additive counts). */
function ingestProfile(projectRoot, eventsPath) {
    const eventsFile = node_path_1.default.resolve(eventsPath);
    if (!node_fs_1.default.existsSync(eventsFile)) {
        throw new Error(`cluaupp profile ingest: missing ${eventsFile}`);
    }
    const events = parseEvents(node_fs_1.default.readFileSync(eventsFile, "utf8"));
    const profilePath = defaultProfilePath(projectRoot);
    const existing = loadProfile(profilePath) || {
        schemaVersion: exports.PGO_SCHEMA_VERSION,
        hot: {},
        structs: {},
    };
    const hot = { ...(existing.hot || {}) };
    const structs = { ...(existing.structs || {}) };
    let merged = 0;
    for (const e of events) {
        const n = typeof e.count === "number" && Number.isFinite(e.count) ? e.count : 1;
        if (e.kind === "struct") {
            structs[e.symbol] = (structs[e.symbol] || 0) + n;
        }
        else {
            hot[e.symbol] = (hot[e.symbol] || 0) + n;
        }
        merged++;
    }
    const profile = {
        schemaVersion: exports.PGO_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        hot,
        structs,
    };
    node_fs_1.default.writeFileSync(profilePath, JSON.stringify(profile, null, "\t") + "\n", "utf8");
    return { profilePath, profile, merged };
}
function rankAdvice(advice, profile) {
    if (!profile) {
        return advice;
    }
    return [...advice]
        .sort((a, b) => {
        const wa = profile.hot[a.target] || profile.structs?.[a.target] || 0;
        const wb = profile.hot[b.target] || profile.structs?.[b.target] || 0;
        return wb - wa;
    })
        .map((a) => {
        const w = profile.hot[a.target] || profile.structs?.[a.target];
        if (!w)
            return a;
        return {
            ...a,
            message: `${a.message} [PGO weight=${w}]`,
            severity: w > 1000 ? "warning" : a.severity,
        };
    });
}
