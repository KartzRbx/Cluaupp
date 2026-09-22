/** Project include/import/require graph + circular dependency detection. */
import fs from "node:fs";
import path from "node:path";
import { collectLanguageModulePaths, resolveModuleFile } from "../clpp/modules.js";
import { collectSources } from "../clpp/paths.js";

export interface GraphEdge {
	from: string;
	to: string;
}

export interface ProjectGraph {
	nodes: string[];
	edges: GraphEdge[];
	cycles: string[][];
}

function findCycles(nodes: string[], edges: GraphEdge[]): string[][] {
	const adj = new Map<string, string[]>();
	for (const n of nodes) adj.set(n, []);
	for (const e of edges) {
		if (!adj.has(e.from)) adj.set(e.from, []);
		adj.get(e.from)!.push(e.to);
	}
	const cycles: string[][] = [];
	const visiting = new Set<string>();
	const visited = new Set<string>();
	const stack: string[] = [];

	function dfs(n: string) {
		if (visiting.has(n)) {
			const i = stack.indexOf(n);
			if (i >= 0) cycles.push(stack.slice(i).concat(n));
			return;
		}
		if (visited.has(n)) return;
		visiting.add(n);
		stack.push(n);
		for (const to of adj.get(n) || []) dfs(to);
		stack.pop();
		visiting.delete(n);
		visited.add(n);
	}
	for (const n of nodes) dfs(n);
	return cycles;
}

export function buildProjectGraph(projectRoot: string, rootDir = "src"): ProjectGraph {
	const srcDir = path.join(projectRoot, rootDir);
	const files = fs.existsSync(srcDir) ? collectSources(srcDir) : [];
	const nodes: string[] = [];
	const edges: GraphEdge[] = [];
	const byAbs = new Map<string, string>();

	for (const file of files) {
		const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
		nodes.push(rel);
		byAbs.set(path.resolve(file), rel);
	}

	for (const file of files) {
		const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
		const source = fs.readFileSync(file, "utf8");
		for (const mod of collectLanguageModulePaths(source)) {
			const resolved = resolveModuleFile(mod, file, srcDir);
			if (!resolved) continue;
			const hit = byAbs.get(path.resolve(resolved));
			if (hit && hit !== rel) {
				edges.push({ from: rel, to: hit });
			}
		}
	}

	return { nodes, edges, cycles: findCycles(nodes, edges) };
}
