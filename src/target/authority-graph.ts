/**
 * Call-graph authority — transitive Client → banned Server paths via include graph.
 * CLUAU_AUTH004 when a client/shared module reaches ServerScriptService/ServerStorage.
 */

import { buildProjectGraph, type ProjectGraph } from "./project-graph.js";
import { runContextFromFileName } from "./roblox.js";
import type { PlatformDiagnostic } from "./diagnostics.js";
import { loadPlatformPolicy, type PlatformPolicy } from "./authority-check.js";

function pathLooksBanned(rel: string, banned: string[]): boolean {
	const norm = rel.replace(/\\/g, "/");
	return banned.some((b) => norm.includes(b));
}

function reachable(graph: ProjectGraph, from: string): Set<string> {
	const adj = new Map<string, string[]>();
	for (const n of graph.nodes) adj.set(n, []);
	for (const e of graph.edges) {
		if (!adj.has(e.from)) adj.set(e.from, []);
		adj.get(e.from)!.push(e.to);
	}
	const seen = new Set<string>();
	const stack = [from];
	while (stack.length) {
		const n = stack.pop()!;
		if (seen.has(n)) continue;
		seen.add(n);
		for (const to of adj.get(n) || []) {
			if (!seen.has(to)) stack.push(to);
		}
	}
	seen.delete(from);
	return seen;
}

export function checkAuthorityGraph(
	projectRoot: string,
	rootDir = "src",
	policy: PlatformPolicy = loadPlatformPolicy(projectRoot),
): PlatformDiagnostic[] {
	const graph = buildProjectGraph(projectRoot, rootDir);
	const out: PlatformDiagnostic[] = [];
	const clientBanned = policy.rules?.clientCannotImport || ["ServerScriptService", "ServerStorage"];

	for (const node of graph.nodes) {
		const ctx = runContextFromFileName(node);
		if (ctx !== "Client" && ctx !== "Shared") continue;

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
