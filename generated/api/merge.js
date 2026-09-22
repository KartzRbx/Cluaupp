"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapNamedTypeLike = void 0;
exports.applyDatatypeOverrides = applyDatatypeOverrides;
exports.applyGlobalsOverrides = applyGlobalsOverrides;
exports.applyLibraryOverrides = applyLibraryOverrides;
exports.applyClassOverrides = applyClassOverrides;
const type_parse_js_1 = require("./type-parse.js");
Object.defineProperty(exports, "mapNamedTypeLike", { enumerable: true, get: function () { return type_parse_js_1.mapNamedTypeLike; } });
function applyDatatypeOverrides(existing, raw) {
    const out = { ...existing };
    for (const [name, spec] of Object.entries(raw)) {
        out[name] = convertDatatypeOverride(name, spec);
    }
    return out;
}
function convertDatatypeOverride(name, spec) {
    const fields = (spec.fields || []).map((f) => {
        const parts = f.trim().split(/\s+/);
        const fieldName = parts.pop() || "value";
        const typeStr = parts.join(" ") || "auto";
        return { name: fieldName, type: (0, type_parse_js_1.parseClppTypeString)(typeStr) };
    });
    const constructors = (spec.ctors || []).map((params, i) => ({
        owner: name,
        overloadIndex: i,
        parameters: params.map((p, idx) => parseParamString(p, idx)),
        tags: [],
    }));
    const staticMethods = (spec.staticMethods || []).map((m, i) => ({
        name: m[0],
        owner: name,
        overloadIndex: i,
        parameters: (m[2] || []).map((p, idx) => parseParamString(p, idx)),
        returnTypes: [(0, type_parse_js_1.parseClppTypeString)(m[1])],
        canYield: false,
        tags: ["static"],
    }));
    const instanceMethods = (spec.methods || []).map((m, i) => ({
        name: m[0],
        owner: name,
        overloadIndex: i,
        parameters: (m[2] || []).map((p, idx) => parseParamString(p, idx)),
        returnTypes: [(0, type_parse_js_1.parseClppTypeString)(m[1])],
        canYield: false,
        tags: [],
    }));
    return {
        name,
        summary: spec.summary,
        fields,
        constructors,
        staticProperties: spec.statics || [],
        staticMethods,
        instanceMethods,
        source: "override",
    };
}
function parseParamString(raw, index) {
    const parts = raw.trim().split(/\s+/);
    const name = parts.pop() || `arg${index}`;
    const typeStr = parts.join(" ") || "auto";
    const type = (0, type_parse_js_1.parseClppTypeString)(typeStr);
    return { name, type, optional: type.kind === "Optional" };
}
function applyGlobalsOverrides(existing, raw) {
    const out = { ...existing };
    for (const [name, g] of Object.entries(raw)) {
        out[name] = {
            name,
            type: g.type ? (0, type_parse_js_1.parseClppTypeString)(g.type) : { kind: "Any" },
            layer: g.layer || "roblox-engine",
            description: g.description,
        };
    }
    return out;
}
function applyLibraryOverrides(existing, raw) {
    return { ...existing, ...raw };
}
function applyClassOverrides(classes, raw) {
    for (const [name, patch] of Object.entries(raw)) {
        if (!classes[name]) {
            continue;
        }
        Object.assign(classes[name], patch, { name });
    }
}
