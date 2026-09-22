"use strict";
/**
 * Call-graph authority — transitive Client → banned Server paths via include graph.
 * CLUAU_AUTH004 when a client/shared module reaches ServerScriptService/ServerStorage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthorityGraph = checkAuthorityGraph;
const project_graph_js_1 = require("./project-graph.js");
const roblox_js_1 = require("./roblox.js");
const authority_check_js_1 = require("./authority-check.js");
function pathLooksBanned(rel, banned) {
    const norm = rel.replace(/\\/g, "/");
    return banned.some((b) => norm.includes(b));
}
function reachable(graph, from) {
    const adj = new Map();
    for (const n of graph.nodes)
        adj.set(n, []);
    for (const e of graph.edges) {
        if (!adj.has(e.from))
            adj.set(e.from, []);
        adj.get(e.from).push(e.to);
    }
    const seen = new Set();
    const stack = [from];
    while (stack.length) {
        const n = stack.pop();
        if (seen.has(n))
            continue;
        seen.add(n);
        for (const to of adj.get(n) || []) {
            if (!seen.has(to))
                stack.push(to);
        }
    }
    seen.delete(from);
    return seen;
}
function checkAuthorityGraph(projectRoot, rootDir = "src", policy = (0, authority_check_js_1.loadPlatformPolicy)(projectRoot)) {
    const graph = (0, project_graph_js_1.buildProjectGraph)(projectRoot, rootDir);
    const out = [];
    const clientBanned = policy.rules?.clientCannotImport || ["ServerScriptService", "ServerStorage"];
    for (const node of graph.nodes) {
        const ctx = (0, roblox_js_1.runContextFromFileName)(node);
        if (ctx !== "Client" && ctx !== "Shared")
            continue;
        const banned = ctx === "Client" ? clientBanned : ["ServerScriptService", "ServerStorage"];
        if (pathLooksBanned(node, banned)) {
            out.push({
                code: "CLUAU_AUTH004",
                message: `Architecture call-graph: ${ctx} file lives under banned path (${node})`,
                line: 1,
                column: 1,
                severity: "error",
                file: node,
            });
            continue;
        }
        for (const dep of reachable(graph, node)) {
            if (pathLooksBanned(dep, banned)) {
                out.push({
                    code: "CLUAU_AUTH004",
                    message: `Architecture call-graph: ${ctx} \`${node}\` transitively reaches banned \`${dep}\``,
                    line: 1,
                    column: 1,
                    severity: "error",
                    file: node,
                });
                break;
            }
        }
    }
    return out;
}
