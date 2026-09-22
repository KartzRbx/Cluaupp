"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestDidYouMean = exports.hoverSymbol = exports.completeMember = void 0;
exports.getApiRegistry = getApiRegistry;
exports.listMembers = listMembers;
exports.describeSymbol = describeSymbol;
exports.similarSymbols = similarSymbols;
const registry_js_1 = require("../api/registry.js");
const build_profile_js_1 = require("../api/build-profile.js");
const resolver_js_1 = require("../api/resolver.js");
let cached = null;
function getApiRegistry(force = false) {
    if (!cached || force) {
        cached = (0, registry_js_1.buildRegistry)((0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true }));
    }
    return cached;
}
/** Member listing for CLPP LSP / tests — not an IDE completion engine. */
function listMembers(className, prefix = "") {
    const registry = getApiRegistry();
    const flat = (0, registry_js_1.flattenMembers)(registry, className);
    const p = prefix.toLowerCase();
    const out = [];
    for (const prop of flat.properties) {
        if (!p || prop.name.toLowerCase().startsWith(p)) {
            out.push({ label: prop.name, kind: "property", detail: (0, resolver_js_1.typeToClpp)(prop.valueType) });
        }
    }
    for (const method of flat.methods) {
        if (!p || method.name.toLowerCase().startsWith(p)) {
            out.push({
                label: method.name,
                kind: "method",
                detail: `(${method.parameters.map((x) => (0, resolver_js_1.typeToClpp)(x.type)).join(", ")})`,
            });
        }
    }
    for (const event of flat.events) {
        if (!p || event.name.toLowerCase().startsWith(p)) {
            out.push({
                label: event.name,
                kind: "event",
                detail: event.parameters.map((x) => (0, resolver_js_1.typeToClpp)(x.type)).join(", "),
            });
        }
    }
    return out;
}
/** @deprecated Use listMembers — name kept for callers during demotion. */
exports.completeMember = listMembers;
function describeSymbol(symbol) {
    const registry = getApiRegistry();
    if (registry.classes.has(symbol)) {
        const cls = registry.classes.get(symbol);
        return `class ${cls.name}${cls.superclass ? ` : ${cls.superclass}` : ""}`;
    }
    if (registry.enums.has(symbol)) {
        return `enum ${symbol} (${registry.enums.get(symbol).items.length} items)`;
    }
    if (registry.datatypes.has(symbol)) {
        return `datatype ${symbol}`;
    }
    const member = registry.members.get(symbol);
    if (member) {
        return `${member.kind} ${symbol}`;
    }
    return null;
}
/** @deprecated Use describeSymbol. */
exports.hoverSymbol = describeSymbol;
function similarSymbols(symbol, limit = 5) {
    const registry = getApiRegistry();
    return (0, registry_js_1.searchRegistry)(registry, symbol.slice(0, Math.max(2, symbol.length - 1)), limit).map((h) => h.symbol);
}
/** @deprecated Use similarSymbols. */
exports.suggestDidYouMean = similarSymbols;
