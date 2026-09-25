"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRojoTree = buildRojoTree;
exports.writeDefaultProject = writeDefaultProject;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function walkFiles(dir, files = []) {
    if (!node_fs_1.default.existsSync(dir)) {
        return files;
    }
    for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
        const full = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(full, files);
            continue;
        }
        files.push(full);
    }
    return files;
}
function withPath(node, relPath) {
    node.$path = relPath.replace(/\\/g, "/");
}
function ensureNode(root, parts) {
    let current = root;
    for (const part of parts) {
        const next = current[part];
        if (next && typeof next === "object") {
            current = next;
            continue;
        }
        const created = {};
        current[part] = created;
        current = created;
    }
    return current;
}
function fileStem(rel) {
    return rel
        .replace(/\.(server|client)\.luau$/i, "")
        .replace(/\.(server|client)\.(clpp|clp|clh)$/i, "")
        .replace(/\.(luau|lua|clpp|clp|clh|flare|hive|mint|bloom|helm|shift|axiom)$/i, "");
}
function mapModules(rootTree, rootAbs, modulesRoot) {
    if (!node_fs_1.default.existsSync(modulesRoot)) {
        return;
    }
    const files = walkFiles(modulesRoot).filter((file) => /\.(luau|lua|clpp|clp|clh)$/i.test(file));
    for (const file of files) {
        const rel = node_path_1.default.relative(rootAbs, file).replace(/\\/g, "/");
        const moduleRel = node_path_1.default.relative(modulesRoot, file).replace(/\\/g, "/");
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
function baseTree() {
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
function buildRojoTree(root, rootDir, outDir) {
    const outRoot = node_path_1.default.join(root, outDir);
    const srcRoot = node_path_1.default.join(root, rootDir);
    const sourceRoot = node_fs_1.default.existsSync(outRoot) ? outRoot : srcRoot;
    const tree = baseTree();
    const relRoot = node_path_1.default.relative(root, sourceRoot).replace(/\\/g, "/");
    withPath(ensureNode(tree, ["ServerScriptService"]), `${relRoot}/Server`);
    withPath(ensureNode(tree, ["ServerScriptService", "Parallel"]), `${relRoot}/Parallel`);
    withPath(ensureNode(tree, ["StarterPlayer", "StarterPlayerScripts"]), `${relRoot}/Client`);
    withPath(ensureNode(tree, ["ReplicatedStorage", "Declarations"]), `${relRoot}/Declarations`);
    withPath(ensureNode(tree, ["ReplicatedStorage", "Include"]), `${relRoot}/Include`);
    mapModules(tree, root, node_path_1.default.join(sourceRoot, "Modules"));
    return tree;
}
function writeDefaultProject(root, rootDir, outDir, projectJsonPath) {
    const file = node_path_1.default.resolve(root, projectJsonPath || "default.project.json");
    const body = {
        name: "cluaupp-game",
        tree: buildRojoTree(root, rootDir, outDir),
    };
    node_fs_1.default.writeFileSync(file, `${JSON.stringify(body, null, "\t")}\n`, "utf8");
    return file;
}
