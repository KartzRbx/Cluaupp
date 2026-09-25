import fs from "node:fs";
import path from "node:path";

type RojoNode = Record<string, unknown>;

function walkFiles(dir: string, files: string[] = []): string[] {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(full, files);
			continue;
		}
		files.push(full);
	}
	return files;
}

function withPath(node: RojoNode, relPath: string): void {
	node.$path = relPath.replace(/\\/g, "/");
}

function ensureNode(root: RojoNode, parts: string[]): RojoNode {
	let current = root;
	for (const part of parts) {
		const next = current[part] as RojoNode | undefined;
		if (next && typeof next === "object") {
			current = next;
			continue;
		}
		const created: RojoNode = {};
		current[part] = created;
		current = created;
	}
	return current;
}

function fileStem(rel: string): string {
	return rel
		.replace(/\.(server|client)\.luau$/i, "")
		.replace(/\.(server|client)\.(clpp|clp|clh)$/i, "")
		.replace(/\.(luau|lua|clpp|clp|clh|flare|hive|mint|bloom|helm|shift|axiom)$/i, "");
}

function mapModules(rootTree: RojoNode, rootAbs: string, modulesRoot: string): void {
	if (!fs.existsSync(modulesRoot)) {
		return;
	}
	const files = walkFiles(modulesRoot).filter((file) => /\.(luau|lua|clpp|clp|clh)$/i.test(file));
	for (const file of files) {
		const rel = path.relative(rootAbs, file).replace(/\\/g, "/");
		const moduleRel = path.relative(modulesRoot, file).replace(/\\/g, "/");
		const stem = fileStem(moduleRel);
		const parts = stem.split("/").filter(Boolean);
		if (parts.length === 0) {
			continue;
		}
		const isServer = /\.server\.(luau|lua|clpp|clp|clh)$/i.test(file);
		const isClient = /\.client\.(luau|lua|clpp|clp|clh)$/i.test(file);
		const rootParts = isServer
			? ["ServerScriptService", "Modules"]
			: isClient
				? ["StarterPlayer", "StarterPlayerScripts", "Modules"]
				: ["ReplicatedStorage", "Modules"];
		const parent = ensureNode(rootTree, [...rootParts, ...parts.slice(0, -1)]);
		const leaf = ensureNode(parent, [parts[parts.length - 1]]);
		withPath(leaf, rel);
	}
}

function baseTree(): RojoNode {
	return {
		$className: "DataModel",
		ServerScriptService: {
			$className: "ServerScriptService",
		},
		ReplicatedStorage: {
			$className: "ReplicatedStorage",
			CluauppLibs: { $path: "libs" },
		},
		StarterPlayer: {
			$className: "StarterPlayer",
			StarterPlayerScripts: {
				$className: "StarterPlayerScripts",
			},
		},
		HttpService: {
			$className: "HttpService",
			$properties: {
				HttpEnabled: true,
			},
		},
	};
}

export function buildRojoTree(root: string, rootDir: string, outDir: string): RojoNode {
	const outRoot = path.join(root, outDir);
	const srcRoot = path.join(root, rootDir);
	const sourceRoot = fs.existsSync(outRoot) ? outRoot : srcRoot;
	const tree = baseTree();
	const relRoot = path.relative(root, sourceRoot).replace(/\\/g, "/");

	withPath(ensureNode(tree, ["ServerScriptService"]), `${relRoot}/Server`);
	withPath(ensureNode(tree, ["ServerScriptService", "Parallel"]), `${relRoot}/Parallel`);
	withPath(ensureNode(tree, ["StarterPlayer", "StarterPlayerScripts"]), `${relRoot}/Client`);
	withPath(ensureNode(tree, ["ReplicatedStorage", "Declarations"]), `${relRoot}/Declarations`);
	withPath(ensureNode(tree, ["ReplicatedStorage", "Include"]), `${relRoot}/Include`);

	mapModules(tree, root, path.join(sourceRoot, "Modules"));
	return tree;
}

export function writeDefaultProject(root: string, rootDir: string, outDir: string, projectJsonPath?: string): string {
	const file = path.resolve(root, projectJsonPath || "default.project.json");
	const body = {
		name: "cluaupp-game",
		tree: buildRojoTree(root, rootDir, outDir),
	};
	fs.writeFileSync(file, `${JSON.stringify(body, null, "\t")}\n`, "utf8");
	return file;
}
