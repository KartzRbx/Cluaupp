"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCreatorDocs = loadCreatorDocs;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const resolver_js_1 = require("../resolver.js");
/**
 * Creator Docs engine reference walker.
 * Expects a local clone of Roblox/creator-docs (or a fixture subtree).
 */
function loadCreatorDocs(rootDir) {
    if (!node_fs_1.default.existsSync(rootDir)) {
        throw new Error(`Creator Docs root not found: ${rootDir}`);
    }
    const pages = [];
    const stack = [rootDir];
    while (stack.length) {
        const dir = stack.pop();
        for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
            const full = node_path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
            }
            else if (/\.(md|mdx|yaml|yml)$/i.test(entry.name)) {
                pages.push(node_path_1.default.relative(rootDir, full).replace(/\\/g, "/"));
            }
        }
    }
    pages.sort();
    return {
        meta: {
            id: "creator-docs",
            path: rootDir,
            hash: (0, resolver_js_1.hashBuffer)(pages.join("\n")),
            loadedAt: new Date().toISOString(),
        },
        data: { pages },
    };
}
