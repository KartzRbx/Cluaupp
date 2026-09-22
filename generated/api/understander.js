"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTENT_RULES = void 0;
exports.matchIntents = matchIntents;
exports.understandSymbol = understandSymbol;
const ide_js_1 = require("./ide.js");
exports.INTENT_RULES = [
    {
        id: "instance-new",
        kind: "create-instance",
        pattern: /\bInstance\s*\.\s*new\b|\bnew\s+[A-Z]\w+\s*\(/,
        description: "Construct a Roblox Instance",
    },
    {
        id: "get-service",
        kind: "get-service",
        pattern: /\bGetService\s*[<(]/,
        description: "Resolve a service via GetService",
    },
    {
        id: "connect-event",
        kind: "connect-event",
        pattern: /\.\s*Connect\s*\(/,
        description: "Connect to an RBXScriptSignal",
    },
    {
        id: "require",
        kind: "require-module",
        pattern: /\brequire\s*\(/,
        description: "Require a ModuleScript / library",
    },
];
function matchIntents(source) {
    return exports.INTENT_RULES.filter((rule) => rule.pattern.test(source));
}
function understandSymbol(symbol, registry) {
    const reg = registry || (0, ide_js_1.getApiRegistry)();
    if (reg.classes.has(symbol)) {
        return { registryHit: true, kind: "class", intents: [] };
    }
    if (reg.services.has(symbol)) {
        return { registryHit: true, kind: "service", intents: ["get-service"] };
    }
    if (reg.enums.has(symbol)) {
        return { registryHit: true, kind: "enum", intents: [] };
    }
    if (reg.datatypes.has(symbol)) {
        return { registryHit: true, kind: "datatype", intents: [] };
    }
    return { registryHit: false, intents: [] };
}
