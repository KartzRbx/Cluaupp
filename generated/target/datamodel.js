"use strict";
/**
 * Typed DataModel v1 — Rojo default.project.json → instance graph.
 * Used for path validation at compile time and generated IntelliSense headers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATAMODEL_SCHEMA_VERSION = void 0;
exports.findProjectJson = findProjectJson;
exports.buildDatamodelProfile = buildDatamodelProfile;
exports.lookupChild = lookupChild;
exports.resolvePath = resolvePath;
exports.listChildNames = listChildNames;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const comment_json_1 = require("comment-json");
exports.DATAMODEL_SCHEMA_VERSION = 1;
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value;
}
function posix(p) {
    return p.replace(/\\/g, "/");
}
function childPath(parentPath, name) {
    if (!parentPath || parentPath === "DataModel") {
        return name;
    }
    return `${parentPath}.${name}`;
}
function readMetaClassName(dir) {
    for (const metaName of ["init.meta.json", "init.meta.jsonc"]) {
        const file = node_path_1.default.join(dir, metaName);
        if (!node_fs_1.default.existsSync(file)) {
            continue;
        }
        try {
            const meta = asRecord((0, comment_json_1.parse)(node_fs_1.default.readFileSync(file, "utf8")));
            if (meta && typeof meta.className === "string") {
                return meta.className;
            }
        }
        catch {
            /* ignore */
        }
    }
    return undefined;
}
function classFromFileName(fileName) {
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
function scanFsChildren(absDir, parentPath, projectRoot) {
    const children = {};
    if (!node_fs_1.default.existsSync(absDir) || !node_fs_1.default.statSync(absDir).isDirectory()) {
        return children;
    }
    let entries;
    try {
        entries = node_fs_1.default.readdirSync(absDir, { withFileTypes: true });
    }
    catch {
        return children;
    }
    for (const entry of entries) {
        if (entry.name.startsWith(".")) {
            continue;
        }
        const full = node_path_1.default.join(absDir, entry.name);
        if (entry.isDirectory()) {
            const className = readMetaClassName(full) || "Folder";
            const nodePath = childPath(parentPath, entry.name);
            children[entry.name] = {
                name: entry.name,
                path: nodePath,
                className,
                fsPath: posix(node_path_1.default.relative(projectRoot, full) || "."),
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
            fsPath: posix(node_path_1.default.relative(projectRoot, full)),
            children: {},
        };
    }
    return children;
}
function walkNamedNode(node, name, parentPath, projectRoot) {
    const record = asRecord(node) || {};
    const nodePath = childPath(parentPath, name);
    const className = typeof record.$className === "string" ? record.$className : "Folder";
    const fsRel = typeof record.$path === "string" ? record.$path : undefined;
    const absFs = fsRel ? node_path_1.default.resolve(projectRoot, fsRel) : undefined;
    const children = {};
    for (const [key, child] of Object.entries(record)) {
        if (key.startsWith("$")) {
            continue;
        }
        children[key] = walkNamedNode(child, key, nodePath, projectRoot);
    }
    if (absFs && node_fs_1.default.existsSync(absFs) && node_fs_1.default.statSync(absFs).isDirectory()) {
        const scanned = scanFsChildren(absFs, nodePath, projectRoot);
        for (const [key, child] of Object.entries(scanned)) {
            if (!children[key]) {
                children[key] = child;
            }
            else {
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
function indexByPath(node, into) {
    into[node.path] = node;
    for (const child of Object.values(node.children)) {
        indexByPath(child, into);
    }
}
function findProjectJson(projectRoot, explicit) {
    const candidates = [
        explicit,
        node_path_1.default.join(projectRoot, "default.project.json"),
        node_path_1.default.join(projectRoot, "default.project.jsonc"),
    ].filter(Boolean);
    for (const c of candidates) {
        const abs = node_path_1.default.resolve(c);
        if (node_fs_1.default.existsSync(abs)) {
            return abs;
        }
    }
    return null;
}
function buildDatamodelProfile(projectRoot, projectJsonPath) {
    const jsonPath = findProjectJson(projectRoot, projectJsonPath);
    if (!jsonPath) {
        return null;
    }
    const raw = (0, comment_json_1.parse)(node_fs_1.default.readFileSync(jsonPath, "utf8"));
    const tree = asRecord(raw.tree) || {};
    const className = typeof tree.$className === "string" ? tree.$className : "DataModel";
    const children = {};
    for (const [key, child] of Object.entries(tree)) {
        if (key.startsWith("$")) {
            continue;
        }
        children[key] = walkNamedNode(child, key, "DataModel", projectRoot);
    }
    const root = {
        name: "DataModel",
        path: "DataModel",
        className,
        children,
    };
    const byPath = {};
    indexByPath(root, byPath);
    return {
        schemaVersion: exports.DATAMODEL_SCHEMA_VERSION,
        projectName: typeof raw.name === "string" ? raw.name : "game",
        projectJson: posix(node_path_1.default.relative(projectRoot, jsonPath) || node_path_1.default.basename(jsonPath)),
        root,
        byPath,
        generatedAt: new Date().toISOString(),
    };
}
function lookupChild(parent, childName) {
    return parent.children[childName];
}
function resolvePath(profile, segments) {
    let node = profile.root;
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
function listChildNames(node) {
    return Object.keys(node.children).sort();
}
