"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProjectGraph = buildProjectGraph;
/** Project include/require graph + circular dependency detection. */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const paths_js_1 = require("../clpp/paths.js");
function includesOf(source) {
    const out = [];
    const re = /#include\s*"([^"]+)"|import\s*\{[^}]+\}\s*from\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(source))) {
        out.push((m[1] || m[2]).replace(/\\/g, "/"));
    }
    return out;
}
function findCycles(nodes, edges) {
    const adj = new Map();
    for (const n of nodes)
        adj.set(n, []);
    for (const e of edges) {
        if (!adj.has(e.from))
            adj.set(e.from, []);
        adj.get(e.from).push(e.to);
    }
    const cycles = [];
    const visiting = new Set();
    const visited = new Set();
    const stack = [];
    function dfs(n) {
        if (visiting.has(n)) {
            const i = stack.indexOf(n);
            if (i >= 0)
                cycles.push(stack.slice(i).concat(n));
            return;
        }
        if (visited.has(n))
            return;
        visiting.add(n);
        stack.push(n);
        for (const to of adj.get(n) || [])
            dfs(to);
        stack.pop();
        visiting.delete(n);
        visited.add(n);
    }
    for (const n of nodes)
        dfs(n);
    return cycles;
}
function buildProjectGraph(projectRoot, rootDir = "src") {
    const srcDir = node_path_1.default.join(projectRoot, rootDir);
    const files = node_fs_1.default.existsSync(srcDir) ? (0, paths_js_1.collectSources)(srcDir) : [];
    const nodes = [];
    const edges = [];
    const byBase = new Map();
    for (const file of files) {
        const rel = node_path_1.default.relative(projectRoot, file).replace(/\\/g, "/");
        nodes.push(rel);
        byBase.set(node_path_1.default.basename(file).replace(/\\/g, "/"), rel);
        byBase.set(node_path_1.default.basename(file, node_path_1.default.extname(file)), rel);
    }
    for (const file of files) {
        const rel = node_path_1.default.relative(projectRoot, file).replace(/\\/g, "/");
        const source = node_fs_1.default.readFileSync(file, "utf8");
        for (const inc of includesOf(source)) {
            const base = node_path_1.default.posix.basename(inc);
            const hit = byBase.get(base) || byBase.get(base.replace(/\.(clh|clpp|clp)$/, ""));
            if (hit && hit !== rel) {
                edges.push({ from: rel, to: hit });
            }
        }
    }
    return { nodes, edges, cycles: findCycles(nodes, edges) };
}
