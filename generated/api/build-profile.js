"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRobloxTargetProfile = buildRobloxTargetProfile;
exports.writeProfileCache = writeProfileCache;
exports.profileContentHash = profileContentHash;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const package_info_js_2 = require("../package-info.js");
const loader_js_1 = require("./loader.js");
const model_js_1 = require("./model.js");
const normalize_js_1 = require("./normalize.js");
const merge_js_1 = require("./merge.js");
const registry_js_1 = require("./registry.js");
const resolver_js_1 = require("./resolver.js");
const mini_dump_js_1 = require("./sources/mini-dump.js");
const validate_js_1 = require("./validate.js");
const DEFAULT_GLOBALS = {
    game: { name: "game", type: { kind: "Class", name: "DataModel" }, layer: "roblox-engine" },
    workspace: { name: "workspace", type: { kind: "Class", name: "Workspace" }, layer: "roblox-engine" },
    script: { name: "script", type: { kind: "Class", name: "LuaSourceContainer" }, layer: "roblox-engine" },
    plugin: { name: "plugin", type: { kind: "Class", name: "Plugin" }, layer: "roblox-engine" },
    typeof: { name: "typeof", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "string" }] }, layer: "luau-core" },
    print: { name: "print", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "void" }], variadic: true }, layer: "luau-core" },
    warn: { name: "warn", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "void" }], variadic: true }, layer: "luau-core" },
    error: { name: "error", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Never" }], variadic: true }, layer: "luau-core" },
    require: { name: "require", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Any" }] }, layer: "luau-core" },
    task: { name: "task", type: { kind: "Any" }, layer: "roblox-engine", description: "Roblox task library" },
};
const DEFAULT_LIBRARIES = {
    math: { name: "math", layer: "luau-core" },
    string: { name: "string", layer: "luau-core" },
    table: { name: "table", layer: "luau-core" },
    bit32: { name: "bit32", layer: "luau-core" },
    buffer: { name: "buffer", layer: "luau-core" },
    coroutine: { name: "coroutine", layer: "luau-core" },
    debug: { name: "debug", layer: "luau-core" },
    os: { name: "os", layer: "luau-core" },
    utf8: { name: "utf8", layer: "luau-core" },
    task: { name: "task", layer: "roblox-engine" },
    Hive: { name: "Hive", layer: "cluaupp-runtime", bind: "Hive" },
    Flare: { name: "Flare", layer: "cluaupp-runtime", bind: "Flare" },
    Roster: { name: "Roster", layer: "cluaupp-runtime", bind: "Roster" },
    Ward: { name: "Ward", layer: "cluaupp-runtime", bind: "Ward" },
    Axiom: { name: "Axiom", layer: "cluaupp-runtime", bind: "Axiom" },
};
function buildRobloxTargetProfile(options = {}) {
    const loaded = (0, mini_dump_js_1.loadMiniDump)(options.dumpPath);
    const { classes, enums, unsupported } = (0, normalize_js_1.normalizeMiniDump)(loaded.data);
    const datatypeFile = (0, loader_js_1.readOverrideFile)("datatypes.json");
    const datatypes = (0, merge_js_1.applyDatatypeOverrides)({}, datatypeFile.data.datatypes || {});
    const globalsFile = (0, loader_js_1.readOverrideFile)("globals.json");
    const globals = (0, merge_js_1.applyGlobalsOverrides)(DEFAULT_GLOBALS, stripMeta(globalsFile.data));
    const libsFile = (0, loader_js_1.readOverrideFile)("libraries.json");
    const libraries = (0, merge_js_1.applyLibraryOverrides)(DEFAULT_LIBRARIES, stripMeta(libsFile.data));
    const classesFile = (0, loader_js_1.readOverrideFile)("classes.json");
    (0, merge_js_1.applyClassOverrides)(classes, stripMeta(classesFile.data));
    const services = (0, registry_js_1.deriveServices)(classes);
    const sources = {
        [loaded.meta.id]: loaded.meta,
        overrides: {
            id: "overrides",
            hash: (0, loader_js_1.overridesHash)(),
            loadedAt: new Date().toISOString(),
            path: node_path_1.default.join(package_info_js_1.projectRoot, "api", "overrides"),
        },
    };
    const profile = {
        target: "roblox",
        schemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        robloxApiVersion: loaded.meta.version != null ? String(loaded.meta.version) : undefined,
        generatorVersion: package_info_js_2.pkg.version,
        sources,
        classes,
        enums,
        datatypes,
        globals,
        libraries,
        services,
        aliases: {},
        constructors: Object.fromEntries(Object.values(datatypes)
            .filter((d) => d.constructors.length)
            .map((d) => [d.name, d.constructors])),
        security: {},
        deprecations: {},
        unsupported,
    };
    if (!options.skipValidate) {
        (0, validate_js_1.assertValid)(profile);
    }
    return profile;
}
function stripMeta(data) {
    const { _meta: _, ...rest } = data;
    return rest;
}
function writeProfileCache(profile, outPath) {
    const target = outPath || node_path_1.default.join(package_info_js_1.projectRoot, "api", "normalized", "roblox-target.profile.json");
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(target), { recursive: true });
    const json = `${JSON.stringify(profile, null, "\t")}\n`;
    const tmp = `${target}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, json, "utf8");
    node_fs_1.default.renameSync(tmp, target);
    return target;
}
function profileContentHash(profile) {
    const clone = { ...profile, sources: { ...profile.sources } };
    for (const key of Object.keys(clone.sources)) {
        clone.sources[key] = { ...clone.sources[key], loadedAt: "" };
    }
    return (0, resolver_js_1.hashBuffer)(JSON.stringify(clone));
}
