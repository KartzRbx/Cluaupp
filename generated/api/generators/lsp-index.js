"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LSP_INDEX_SCHEMA_VERSION = void 0;
exports.buildLspIndex = buildLspIndex;
exports.writeLspIndex = writeLspIndex;
/**
 * Stable LSP metadata index for the CL++ Language Server.
 * Cluaupp writes JSON; CLPP reads it. No LSP protocol here.
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../../package-info.js");
const package_info_js_2 = require("../../package-info.js");
const model_js_1 = require("../model.js");
const resolver_js_1 = require("../resolver.js");
const registry_js_1 = require("../registry.js");
exports.LSP_INDEX_SCHEMA_VERSION = 1;
function buildLspIndex(profile) {
    const registry = (0, registry_js_1.buildRegistry)(profile);
    const classes = {};
    for (const name of Object.keys(profile.classes).sort()) {
        const cls = profile.classes[name];
        const flat = (0, registry_js_1.flattenMembers)(registry, name);
        const members = [];
        for (const prop of flat.properties) {
            members.push({
                kind: "property",
                name: prop.name,
                detail: (0, resolver_js_1.typeToClpp)(prop.valueType),
                threadSafety: prop.threadSafety,
            });
        }
        for (const method of flat.methods) {
            members.push({
                kind: "method",
                name: method.name,
                detail: `(${method.parameters.map((p) => (0, resolver_js_1.typeToClpp)(p.type)).join(", ")})`,
                threadSafety: method.threadSafety,
            });
        }
        for (const event of flat.events) {
            members.push({
                kind: "event",
                name: event.name,
                detail: event.parameters.map((p) => (0, resolver_js_1.typeToClpp)(p.type)).join(", "),
                threadSafety: event.threadSafety,
            });
        }
        for (const cb of cls.callbacks) {
            members.push({ kind: "callback", name: cb.name, threadSafety: cb.threadSafety });
        }
        classes[name] = {
            name,
            superclass: cls.superclass,
            service: cls.service || cls.creation.service,
            creatable: cls.creatable || cls.creation.creatable,
            members,
        };
    }
    return {
        schemaVersion: exports.LSP_INDEX_SCHEMA_VERSION,
        targetSchemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        generatorVersion: package_info_js_2.pkg.version,
        classes,
        services: Object.keys(profile.services).sort(),
        enums: Object.keys(profile.enums).sort(),
        datatypes: Object.keys(profile.datatypes).sort(),
        globals: Object.keys(profile.globals).sort(),
    };
}
function writeLspIndex(profile, outPath = node_path_1.default.join(package_info_js_1.projectRoot, "api", "generated", "lsp-index.json")) {
    const doc = buildLspIndex(profile);
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(outPath), { recursive: true });
    const tmp = `${outPath}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, `${JSON.stringify(doc)}\n`, "utf8");
    node_fs_1.default.renameSync(tmp, outPath);
    return outPath;
}
