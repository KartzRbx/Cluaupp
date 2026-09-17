"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_COLON = exports.LIBRARY_METHODS = exports.LIBRARY_TYPES = exports.EXTRA_TYPE_EXPORTS = exports.TYPE_EXPORTS = exports.INCLUDE_TO_MODULE = exports.MODULES = void 0;
exports.isLibraryType = isLibraryType;
exports.isLibraryMethod = isLibraryMethod;
exports.collectLibraries = collectLibraries;
exports.requireCluauppLib = requireCluauppLib;
exports.emitRequires = emitRequires;
exports.insertRequires = insertRequires;
exports.insertModuleRequires = insertModuleRequires;
exports.insertPreamble = insertPreamble;
// @ts-nocheck
const node_path_1 = __importDefault(require("node:path"));
const TYPE_EXPORTS = {
    Janitor: "Janitor",
    Promise: "Promise",
    Net: "Net",
    Icon: "Icon",
    StateMachine: "StateMachine",
    Spring: "Spring",
    StickyBillboard: "StickyBillboard",
    EzVisualz: "EzVisualz",
    Module3D: "Module3D",
    MathUtils: "MathUtils",
    Twinkle: "Twinkle",
    VfxUtil: "VfxUtil",
    FormatNumber: "FormatNumber",
    Fusion: "Fusion",
    Iris: "Iris",
    Cmdr: "Cmdr",
    Chrono: "Chrono",
    DataService: "DataService",
    Display: "Display",
};
exports.TYPE_EXPORTS = TYPE_EXPORTS;
const EXTRA_TYPE_EXPORTS = {
    DataService: {
        Data: "Data",
        DataPath: "Path",
        DataServiceServer: "ServerApi",
        DataServiceClient: "ClientApi",
    },
};
exports.EXTRA_TYPE_EXPORTS = EXTRA_TYPE_EXPORTS;
const MODULES = {
    Janitor: { file: "Janitor", bind: "Janitor" },
    Promise: { file: "Promise", bind: "Promise" },
    Net: { file: "Net", bind: "Net" },
    NetEvent: { file: "Net", bind: "Net" },
    NetFunction: { file: "Net", bind: "Net" },
    MathUtils: { file: "MathUtils", bind: "MathUtils" },
    FormatNumber: { file: "FormatNumber", bind: "FormatNumber" },
    Module3D: { file: "Module3D", bind: "Module3D" },
    Model3D: { file: "Module3D", bind: "Module3D" },
    Twinkle: { file: "Twinkle", bind: "Twinkle" },
    DataService: { file: "DataService", bind: "DataService" },
    EzVisualz: { file: "EzVisualz", bind: "EzVisualz" },
    EzVisual: { file: "EzVisualz", bind: "EzVisualz" },
    Spring: { file: "Spring", bind: "Spring" },
    Display: { file: "Display", bind: "Display" },
    StickyBillboard: { file: "StickyBillboard", bind: "StickyBillboard" },
    Icon: { file: "TopbarPlus", bind: "Icon" },
    TopbarPlus: { file: "TopbarPlus", bind: "Icon" },
    Cmdr: { file: "Cmdr", bind: "Cmdr" },
    Chrono: { file: "Chrono", bind: "Chrono" },
    Iris: { file: "Iris", bind: "Iris" },
    Fusion: { file: "Fusion", bind: "Fusion" },
    StateMachine: { file: "StateMachine", bind: "StateMachine" },
    VfxUtil: { file: "VfxUtil", bind: "VfxUtil" },
    ArrayIndexer: { file: "ArrayIndexer", bind: "ArrayIndexer" },
    Occlude: { file: "Occlude", bind: "Occlude" },
};
exports.MODULES = MODULES;
const INCLUDE_TO_MODULE = {
    janitor: "Janitor",
    promise: "Promise",
    net: "Net",
    math: "MathUtils",
    mathutils: "MathUtils",
    formatnumber: "FormatNumber",
    module3d: "Module3D",
    dataservice: "DataService",
    dataservicev2: "DataService",
    ezvisual: "EzVisualz",
    ezvisualz: "EzVisualz",
    twinkle: "Twinkle",
    spring: "Spring",
    display: "Display",
    stickybillboard: "StickyBillboard",
    topbarplus: "Icon",
    icon: "Icon",
    cmdr: "Cmdr",
    chrono: "Chrono",
    iris: "Iris",
    fusion: "Fusion",
    statemachine: "StateMachine",
    robloxstatemachine: "StateMachine",
    vfx: "VfxUtil",
    vfxutil: "VfxUtil",
    arrayindexer: "ArrayIndexer",
    occlude: "Occlude",
    libs: null,
};
exports.INCLUDE_TO_MODULE = INCLUDE_TO_MODULE;
const LIBRARY_TYPES = new Set(Object.keys(MODULES));
exports.LIBRARY_TYPES = LIBRARY_TYPES;
const LIBRARY_METHODS = new Set([
    "Add",
    "AddObject",
    "AddPromise",
    "Remove",
    "RemoveNoClean",
    "RemoveList",
    "RemoveListNoClean",
    "GetAll",
    "Cleanup",
    "Destroy",
    "LinkToInstance",
    "LinkToInstances",
    "Then",
    "Catch",
    "Finally",
    "Await",
    "Cancel",
    "Fire",
    "FireAll",
    "On",
    "OnClient",
    "OnServer",
    "Invoke",
    "InvokeServer",
    "InvokeClient",
    "Attach3D",
    "Update",
    "SetCFrame",
    "GetCFrame",
    "SetDepthMultiplier",
    "GetDepthMultiplier",
    "GetPersisted",
    "GetTransient",
    "HasTransient",
    "SetTransient",
    "UpdateTransient",
    "ClearTransient",
    "ArrayInsert",
    "ArrayInsertTransient",
    "ArrayRemove",
    "ArrayRemoveTransient",
    "GetOrderedList",
    "GetOrderedListWithPriority",
    "GetChangedSignal",
    "GetPathChangedSignal",
    "GetIndexChangedSignal",
    "GetArrayInsertedSignal",
    "GetArrayRemovedSignal",
    "Typed",
    "WaitFor",
    "WaitForData",
    "HasData",
    "GetProfile",
    "GetBufferStats",
    "Init",
    "Observe",
    "Impulse",
    "SetGoal",
    "Set",
    "Get",
    "Step",
    "Fade",
    "FrameSlide",
    "FrameZoom",
    "FrameBounce",
    "ShowText",
    "SetButtonStyle",
    "FadeSlideRunoff",
    "Abbreviate",
    "Comma",
    "Compact",
    "Play",
    "Pause",
    "Resume",
    "Stop",
    "BindEvent",
    "bindEvent",
    "BindFunction",
    "RegisterDefaultCommands",
    "RegisterHook",
    "RegisterType",
    "RegisterCommand",
    "ChangeState",
    "GetState",
    "GetCurrentState",
    "GetPreviousState",
    "GetData",
    "ChangeData",
    "LoadDirectory",
    "setLabel",
    "setImage",
    "setEnabled",
    "setName",
    "setOrder",
    "setWidth",
    "align",
    "setLeft",
    "setMid",
    "setRight",
    "bindToggleItem",
    "modifyTheme",
    "setTheme",
    "notify",
    "clearNotices",
    "select",
    "deselect",
    "autoDeselect",
    "SetText",
    "SetEnabled",
    "SetMaxDistance",
    "SetActive",
    "GetActive",
    "End",
    "Scale",
    "DestroyAfter",
    "Burst",
    "CloneOnto",
    "Shutdown",
    "Append",
    "PushConfig",
    "PopConfig",
    "ForceRefresh",
]);
exports.LIBRARY_METHODS = LIBRARY_METHODS;
const MODULE_COLON = new Set(["Attach3D", "RegisterDefaultCommands", "RegisterHook", "Connect", "LoadDirectory"]);
exports.MODULE_COLON = MODULE_COLON;
function isLibraryType(name) {
    return LIBRARY_TYPES.has(name);
}
function isLibraryMethod(name) {
    return LIBRARY_METHODS.has(name);
}
function walk(node, visit) {
    if (!node || typeof node !== "object") {
        return;
    }
    visit(node);
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                walk(item, visit);
            }
        }
        else if (value && typeof value === "object") {
            walk(value, visit);
        }
    }
}
function modulesFromIncludes(source) {
    const found = new Set();
    for (const line of String(source).split(/\r?\n/)) {
        const match = line.match(/^\s*#\s*include\s+<cluaupp\/(?:libs\/)?([A-Za-z0-9]+)\.hpp>/);
        if (!match) {
            continue;
        }
        const key = match[1].toLowerCase();
        const mapped = INCLUDE_TO_MODULE[key];
        if (mapped) {
            found.add(mapped);
        }
        if (key === "libs") {
            found.add("Janitor");
            found.add("Promise");
            found.add("Net");
            found.add("MathUtils");
            found.add("FormatNumber");
            found.add("Module3D");
            found.add("Twinkle");
            found.add("DataService");
        }
    }
    return found;
}
function collectLibraries(source, ast) {
    const used = modulesFromIncludes(source);
    walk(ast, (node) => {
        if (node.type === "ident" && MODULES[node.name]) {
            used.add(node.name === "NetEvent" || node.name === "NetFunction" ? "Net" : node.name);
        }
        if (node.type === "new" && MODULES[node.className]) {
            used.add(node.className === "NetEvent" || node.className === "NetFunction" ? "Net" : node.className);
        }
        if (node.type === "call" && node.object && node.object.type === "ident" && MODULES[node.object.name]) {
            const name = node.object.name;
            used.add(name === "NetEvent" || name === "NetFunction" ? "Net" : name);
        }
    });
    const unique = [];
    const seenBind = new Set();
    for (const name of used) {
        const spec = MODULES[name];
        if (!spec || seenBind.has(spec.bind)) {
            continue;
        }
        seenBind.add(spec.bind);
        unique.push(spec);
    }
    return unique;
}
const ROJO_ROOTS = {
    shared: { service: "ReplicatedStorage", expr: "ReplicatedStorage.Cluaupp" },
    server: { service: "ServerScriptService", expr: "ServerScriptService.Cluaupp" },
    client: { service: "StarterPlayer", expr: "StarterPlayer.StarterPlayerScripts.Cluaupp" },
};
const SERVICE_ORDER = ["ReplicatedStorage", "ServerScriptService", "StarterPlayer"];
const SERVICE_GET = {
    ReplicatedStorage: 'const ReplicatedStorage = game:GetService("ReplicatedStorage")',
    ServerScriptService: 'const ServerScriptService = game:GetService("ServerScriptService")',
    StarterPlayer: 'const StarterPlayer = game:GetService("StarterPlayer")',
};
function requireCluauppLib(name) {
    return `require(ReplicatedStorage.CluauppLibs.${name})`;
}
function parseOutRel(toOutRel) {
    const posix = String(toOutRel || "module.luau")
        .replace(/\\/g, "/")
        .replace(/\.luau$/i, "");
    const parts = posix.split("/").filter(Boolean);
    const tree = parts[0];
    const root = ROJO_ROOTS[tree] || null;
    const rest = root ? parts.slice(1) : parts;
    return { tree, root, rest, posix };
}
function robloxRequireFrom(_fromOutRel, toOutRel) {
    const { root, rest } = parseOutRel(toOutRel);
    if (root) {
        const tail = rest.join(".");
        return tail ? `require(${root.expr}.${tail})` : `require(${root.expr})`;
    }
    const fromDir = node_path_1.default.posix.dirname(String(_fromOutRel || "module.luau").replace(/\\/g, "/"));
    const toMod = String(toOutRel || "module.luau")
        .replace(/\\/g, "/")
        .replace(/\.luau$/i, "");
    let rel = node_path_1.default.posix.relative(fromDir, toMod);
    if (!rel || rel === ".") {
        rel = node_path_1.default.posix.basename(toMod);
    }
    const parts = rel.split("/");
    let expr = "script.Parent";
    for (const part of parts) {
        if (part === "..") {
            expr += ".Parent";
        }
        else if (part && part !== ".") {
            expr += `.${part}`;
        }
    }
    return `require(${expr})`;
}
function emitLibraryLines(libraries) {
    const api = [];
    const types = [];
    for (const spec of libraries) {
        api.push(`const ${spec.bind} = ${requireCluauppLib(spec.file)}`);
        const exported = TYPE_EXPORTS[spec.bind];
        if (exported) {
            types.push(`type ${spec.bind} = ${spec.bind}.${exported}`);
        }
        const extra = EXTRA_TYPE_EXPORTS[spec.bind];
        if (extra) {
            for (const [alias, exportedName] of Object.entries(extra)) {
                types.push(`type ${alias} = ${spec.bind}.${exportedName}`);
            }
        }
    }
    return { api, types };
}
function emitRequireParts(libraries) {
    if (!libraries.length) {
        return { api: "", types: "" };
    }
    const { api, types } = emitLibraryLines(libraries);
    api.unshift(SERVICE_GET.ReplicatedStorage);
    return {
        api: `${api.join("\n")}\n`,
        types: types.length ? `${types.join("\n")}\n` : "",
    };
}
function emitRequires(libraries) {
    const { api, types } = emitRequireParts(libraries);
    return [api, types].filter((part) => Boolean(part && part.trim())).join("\n");
}
function insertRequires(luau, libraries) {
    const block = emitRequires(libraries).trimEnd();
    if (!block) {
        return luau;
    }
    return insertBlock(luau, block);
}
function moduleIsUsed(luau, spec) {
    if (String(luau).includes(spec.name)) {
        return true;
    }
    const exported = [...((spec.exports && spec.exports.consts) || []), ...((spec.exports && spec.exports.structs) || [])];
    return exported.some((name) => String(luau).includes(name));
}
function moduleRequireLines(modules, fromOutRel, luau) {
    const lines = [];
    const services = new Set();
    const seen = new Set();
    for (const spec of modules || []) {
        if (!spec || !spec.name || seen.has(spec.name)) {
            continue;
        }
        if (fromOutRel && !moduleIsUsed(luau, spec)) {
            continue;
        }
        seen.add(spec.name);
        const { root } = parseOutRel(spec.outRel);
        if (root) {
            services.add(root.service);
        }
        lines.push(`const ${spec.name} = ${robloxRequireFrom(fromOutRel, spec.outRel)}`);
        for (const name of (spec.exports && spec.exports.consts) || []) {
            if (name !== spec.name) {
                lines.push(`const ${name} = ${spec.name}.${name}`);
            }
        }
        if (((spec.exports && spec.exports.structs) || []).includes(spec.name) || (spec.exports && spec.exports.hasProtos)) {
            lines.push(`type ${spec.name} = ${spec.name}.${spec.name}`);
        }
    }
    return { lines, services };
}
function insertModuleRequires(luau, modules, fromOutRel) {
    return insertPreamble(luau, modules, [], fromOutRel);
}
function stripServiceGets(luau, services) {
    let next = String(luau);
    for (const name of services) {
        const line = SERVICE_GET[name];
        if (!line) {
            continue;
        }
        next = next.replace(new RegExp(`^${line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "m"), "");
    }
    return next;
}
function insertPreamble(luau, modules, libraries, fromOutRel) {
    const text = String(luau || "");
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[") || /\.json$/i.test(String(fromOutRel || ""))) {
        return luau;
    }
    const { lines: moduleLines, services } = moduleRequireLines(modules, fromOutRel, luau);
    const libList = libraries || [];
    if (libList.length) {
        services.add("ReplicatedStorage");
    }
    if (moduleLines.length === 0 && libList.length === 0) {
        return luau;
    }
    const { api: libApi, types: libTypes } = emitLibraryLines(libList);
    const blockLines = [];
    for (const name of SERVICE_ORDER) {
        if (services.has(name)) {
            blockLines.push(SERVICE_GET[name]);
        }
    }
    blockLines.push(...moduleLines);
    blockLines.push(...libApi);
    blockLines.push(...libTypes);
    const body = stripServiceGets(luau, services);
    return insertBlock(body, blockLines.join("\n"));
}
function insertBlock(luau, block) {
    const match = String(luau).match(/^(?:--[^\n]*\n)+/);
    if (!match) {
        return `${block}\n${luau}`;
    }
    const insertAt = match[0].length;
    const rest = luau.slice(insertAt).replace(/^\n*/, "\n");
    return `${luau.slice(0, insertAt)}\n${block}\n${rest}`;
}
