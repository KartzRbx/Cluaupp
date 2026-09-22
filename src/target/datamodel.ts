/**
 * Typed DataModel v1 — Rojo default.project.json → instance graph.
 * Used for path validation at compile time and generated IntelliSense headers.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "comment-json";

export const DATAMODEL_SCHEMA_VERSION = 1;

export interface DatamodelNode {
	/** Roblox instance name (tree key). */
	name: string;
	/** Dot path from game, e.g. ReplicatedStorage.Shared (DataModel root is "DataModel"). */
	path: string;
	className: string;
	/** Project-relative fs path when backed by $path. */
	fsPath?: string;
	children: Record<string, DatamodelNode>;
}

export interface DatamodelProfile {
	schemaVersion: number;
	projectName: string;
	projectJson: string;
	root: DatamodelNode;
	/** Flat index path → node */
	byPath: Record<string, DatamodelNode>;
	generatedAt: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function posix(p: string): string {
	return p.replace(/\\/g, "/");
}

function childPath(parentPath: string, name: string): string {
	if (!parentPath || parentPath === "DataModel") {
		return name;
	}
	return `${parentPath}.${name}`;
}

function readMetaClassName(dir: string): string | undefined {
	for (const metaName of ["init.meta.json", "init.meta.jsonc"]) {
		const file = path.join(dir, metaName);
		if (!fs.existsSync(file)) {
			continue;
		}
		try {
			const meta = asRecord(parse(fs.readFileSync(file, "utf8")));
			if (meta && typeof meta.className === "string") {
				return meta.className;
			}
		} catch {
			/* ignore */
		}
	}
	return undefined;
}

function classFromFileName(fileName: string): { name: string; className: string } | null {
	const lower = fileName.toLowerCase();
	if (lower === "init.meta.json" || lower === "init.meta.jsonc") {
		return null;
	}
	if (/\.server\.(luau|lua|clpp)$/i.test(fileName)) {
		return { name: fileName.replace(/\.server\.(luau|lua|clpp)$/i, ""), className: "Script" };
	}
	if (/\.client\.(luau|lua|clpp)$/i.test(fileName)) {
		return { name: fileName.replace(/\.client\.(luau|lua|clpp)$/i, ""), className: "LocalScript" };
	}
	if (/\.plugin\.(luau|lua|clpp)$/i.test(fileName)) {
		return { name: fileName.replace(/\.plugin\.(luau|lua|clpp)$/i, ""), className: "Script" };
	}
	if (/^init\.(luau|lua|clpp|clp)$/i.test(fileName)) {
		return null;
	}
	if (/\.(luau|lua|clpp|clp|clh)$/i.test(fileName)) {
		return {
			name: fileName.replace(/\.(luau|lua|clpp|clp|clh)$/i, ""),
			className: "ModuleScript",
		};
	}
	return null;
}

function scanFsChildren(absDir: string, parentPath: string, projectRoot: string): Record<string, DatamodelNode> {
	const children: Record<string, DatamodelNode> = {};
	if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
		return children;
	}
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(absDir, { withFileTypes: true });
	} catch {
		return children;
	}
	for (const entry of entries) {
		if (entry.name.startsWith(".")) {
			continue;
		}
		const full = path.join(absDir, entry.name);
		if (entry.isDirectory()) {
			const className = readMetaClassName(full) || "Folder";
			const nodePath = childPath(parentPath, entry.name);
			children[entry.name] = {
				name: entry.name,
				path: nodePath,
				className,
				fsPath: posix(path.relative(projectRoot, full) || "."),
				children: scanFsChildren(full, nodePath, projectRoot),
			};
			continue;
		}
		if (!entry.isFile()) {
			continue;
		}
		const mapped = classFromFileName(entry.name);
		if (!mapped || !mapped.name) {
			continue;
		}
		const nodePath = childPath(parentPath, mapped.name);
		children[mapped.name] = {
			name: mapped.name,
			path: nodePath,
			className: mapped.className,
			fsPath: posix(path.relative(projectRoot, full)),
			children: {},
		};
	}
	return children;
}

function walkNamedNode(node: unknown, name: string, parentPath: string, projectRoot: string): DatamodelNode {
	const record = asRecord(node) || {};
	const nodePath = childPath(parentPath, name);
	const className = typeof record.$className === "string" ? record.$className : "Folder";
	const fsRel = typeof record.$path === "string" ? record.$path : undefined;
	const absFs = fsRel ? path.resolve(projectRoot, fsRel) : undefined;

	const children: Record<string, DatamodelNode> = {};
	for (const [key, child] of Object.entries(record)) {
		if (key.startsWith("$")) {
			continue;
		}
		children[key] = walkNamedNode(child, key, nodePath, projectRoot);
	}

	if (absFs && fs.existsSync(absFs) && fs.statSync(absFs).isDirectory()) {
		const scanned = scanFsChildren(absFs, nodePath, projectRoot);
		for (const [key, child] of Object.entries(scanned)) {
			if (!children[key]) {
				children[key] = child;
			} else {
				children[key] = {
					...children[key],
					fsPath: children[key].fsPath || child.fsPath,
					children: { ...child.children, ...children[key].children },
				};
			}
		}
	}

	return {
		name,
		path: nodePath,
		className,
		fsPath: fsRel ? posix(fsRel) : undefined,
		children,
	};
}

function indexByPath(node: DatamodelNode, into: Record<string, DatamodelNode>): void {
	into[node.path] = node;
	for (const child of Object.values(node.children)) {
		indexByPath(child, into);
	}
}

export function findProjectJson(projectRoot: string, explicit?: string): string | null {
	const candidates = [
		explicit,
		path.join(projectRoot, "default.project.json"),
		path.join(projectRoot, "default.project.jsonc"),
	].filter(Boolean) as string[];
	for (const c of candidates) {
		const abs = path.resolve(c);
		if (fs.existsSync(abs)) {
			return abs;
		}
	}
	return null;
}

export function buildDatamodelProfile(projectRoot: string, projectJsonPath?: string): DatamodelProfile | null {
	const jsonPath = findProjectJson(projectRoot, projectJsonPath);
	if (!jsonPath) {
		return null;
	}
	const raw = parse(fs.readFileSync(jsonPath, "utf8")) as { name?: string; tree?: unknown };
	const tree = asRecord(raw.tree) || {};
	const className = typeof tree.$className === "string" ? tree.$className : "DataModel";
	const children: Record<string, DatamodelNode> = {};
	for (const [key, child] of Object.entries(tree)) {
		if (key.startsWith("$")) {
			continue;
		}
		children[key] = walkNamedNode(child, key, "DataModel", projectRoot);
	}

	const root: DatamodelNode = {
		name: "DataModel",
		path: "DataModel",
		className,
		children,
	};

	const byPath: Record<string, DatamodelNode> = {};
	indexByPath(root, byPath);

	return {
		schemaVersion: DATAMODEL_SCHEMA_VERSION,
		projectName: typeof raw.name === "string" ? raw.name : "game",
		projectJson: posix(path.relative(projectRoot, jsonPath) || path.basename(jsonPath)),
		root,
		byPath,
		generatedAt: new Date().toISOString(),
	};
}

export function lookupChild(parent: DatamodelNode, childName: string): DatamodelNode | undefined {
	return parent.children[childName];
}

export function resolvePath(profile: DatamodelProfile, segments: string[]): DatamodelNode | null {
	let node: DatamodelNode = profile.root;
	for (const seg of segments) {
		if (seg === "game" || seg === "DataModel") {
			node = profile.root;
			continue;
		}
		const next = lookupChild(node, seg);
		if (!next) {
			return null;
		}
		node = next;
	}
	return node;
}

export function listChildNames(node: DatamodelNode): string[] {
	return Object.keys(node.children).sort();
}
