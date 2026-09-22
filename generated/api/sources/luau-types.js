"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLuauTypes = loadLuauTypes;
const node_fs_1 = __importDefault(require("node:fs"));
const resolver_js_1 = require("../resolver.js");
/**
 * Parse LuauTypes.d.luau into a lightweight symbol index.
 * Full type AST is deferred; we extract declare/class/type names for cross-check.
 */
function loadLuauTypes(filePath) {
    if (!node_fs_1.default.existsSync(filePath)) {
        throw new Error(`LuauTypes file not found: ${filePath}`);
    }
    const raw = node_fs_1.default.readFileSync(filePath);
    const text = raw.toString("utf8");
    const symbols = new Set();
    const declareRe = /\b(?:declare|type|export type|class)\s+([A-Za-z_][\w.]*)/g;
    let match;
    while ((match = declareRe.exec(text))) {
        symbols.add(match[1].split(".")[0]);
    }
    return {
        meta: {
            id: "luau-types",
            path: filePath,
            hash: (0, resolver_js_1.hashBuffer)(raw),
            loadedAt: new Date().toISOString(),
        },
        data: { symbols: [...symbols].sort(), textHash: (0, resolver_js_1.hashBuffer)(raw) },
    };
}
