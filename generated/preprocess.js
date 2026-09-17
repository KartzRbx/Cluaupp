"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_EXTS = void 0;
exports.isSourceFile = isSourceFile;
exports.isHeaderFile = isHeaderFile;
exports.toLuauPath = toLuauPath;
exports.isEngineStub = isEngineStub;
exports.siblingImplementation = siblingImplementation;
exports.siblingHeader = siblingHeader;
exports.implOutName = implOutName;
exports.resolveInclude = resolveInclude;
exports.scanHeaderExports = scanHeaderExports;
exports.applyPragmas = applyPragmas;
exports.preprocess = preprocess;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
exports.SOURCE_EXTS = [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hh"];
function isSourceFile(fileName) {
    return exports.SOURCE_EXTS.includes(node_path_1.default.extname(fileName).toLowerCase());
}
function isHeaderFile(fileName) {
    return [".h", ".hpp", ".hh"].includes(node_path_1.default.extname(fileName).toLowerCase());
}
function toLuauPath(filePath) {
    return filePath.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
}
function isEngineStub(filePath) {
    const normalized = filePath.replace(/\\/g, "/").toLowerCase();
    return (normalized.includes("/include/cluaupp/") ||
        normalized.includes("/include/cluau/") ||
        normalized.endsWith("/roblox.hpp") ||
        normalized.endsWith("/roblox.h"));
}
function includeVariants(name) {
    const variants = [name];
    if (/\.h$/i.test(name)) {
        variants.push(name.replace(/\.h$/i, ".hpp"), name.replace(/\.h$/i, ".hh"));
    }
    else if (/\.hpp$/i.test(name)) {
        variants.push(name.replace(/\.hpp$/i, ".h"), name.replace(/\.hpp$/i, ".hh"));
    }
    else if (/\.hh$/i.test(name)) {
        variants.push(name.replace(/\.hh$/i, ".h"), name.replace(/\.hh$/i, ".hpp"));
    }
    return [...new Set(variants)];
}
function siblingImplementation(headerPath) {
    if (!headerPath || !isHeaderFile(headerPath)) {
        return null;
    }
    const base = headerPath.replace(/\.(h|hpp|hh)$/i, "");
    for (const ext of [".cpp", ".cc", ".cxx", ".c"]) {
        if (node_fs_1.default.existsSync(base + ext)) {
            return base + ext;
        }
    }
    return null;
}
function siblingHeader(implPath) {
    if (!implPath || isHeaderFile(implPath)) {
        return null;
    }
    const base = String(implPath).replace(/\.(cpp|cc|cxx|c)$/i, "");
    if (base === String(implPath)) {
        return null;
    }
    for (const ext of [".h", ".hpp", ".hh"]) {
        if (node_fs_1.default.existsSync(base + ext)) {
            return base + ext;
        }
    }
    return null;
}
function implOutName(rel) {
    return String(rel)
        .replace(/\\/g, "/")
        .replace(/\.(cpp|cc|cxx|c)$/i, "Impl.luau");
}
function resolveInclude(name, fromFile, includeDirs) {
    const bases = [node_path_1.default.dirname(fromFile), ...(includeDirs || [])];
    for (const base of bases) {
        for (const variant of includeVariants(name)) {
            const candidate = node_path_1.default.resolve(base, variant);
            if (node_fs_1.default.existsSync(candidate) && node_fs_1.default.statSync(candidate).isFile()) {
                return candidate;
            }
        }
    }
    return null;
}
function scanHeaderExports(source) {
    const consts = [];
    const structs = [];
    for (const match of String(source).matchAll(/\bconst\s+(?:int|bool|float|double|auto|string)\s+(\w+)/g)) {
        if (!consts.includes(match[1])) {
            consts.push(match[1]);
        }
    }
    for (const match of String(source).matchAll(/\bstruct\s+(\w+)/g)) {
        if (!structs.includes(match[1])) {
            structs.push(match[1]);
        }
    }
    const hasProtos = /\b(?:void|int|bool|float|double|auto|string|[\w:]+)\s+\w+\s*\([^;]*\)\s*;/.test(String(source));
    return { consts, structs, hasProtos };
}
function pushModuleInclude(options, resolved, impl) {
    options.moduleIncludes = options.moduleIncludes || [];
    const srcDir = options.srcDir || null;
    const moduleFile = impl || resolved;
    const rel = srcDir ? node_path_1.default.relative(srcDir, moduleFile).replace(/\\/g, "/") : node_path_1.default.basename(moduleFile);
    const headerText = node_fs_1.default.readFileSync(resolved, "utf8");
    options.moduleIncludes.push({
        name: node_path_1.default.basename(resolved).replace(/\.(h|hpp|hh)$/i, ""),
        outRel: rel.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau"),
        header: resolved,
        impl: impl || null,
        exports: scanHeaderExports(headerText),
    });
}
function applyPragmas(source, options) {
    let nstrict = false;
    let strict = false;
    for (const line of String(source).split(/\r?\n/)) {
        if (/^\s*#\s*pragma\s+nstrict\b/i.test(line)) {
            nstrict = true;
        }
        else if (/^\s*#\s*pragma\s+strict\b/i.test(line)) {
            strict = true;
        }
    }
    if (nstrict) {
        options.strict = false;
    }
    else if (strict) {
        options.strict = true;
    }
}
function preprocess(source, filePath, options = {}) {
    if (!options.pragmaResolved) {
        options.pragmaResolved = true;
        applyPragmas(source, options);
    }
    const seen = options.seen || new Set();
    options.seen = seen;
    const includeDirs = options.includeDirs || [];
    const resolvedSelf = filePath ? node_path_1.default.resolve(filePath) : null;
    if (resolvedSelf) {
        seen.add(resolvedSelf);
    }
    const lines = String(source).split(/\r?\n/);
    const out = [];
    for (const line of lines) {
        const quoted = line.match(/^\s*#\s*include\s+"([^"]+)"/);
        if (quoted) {
            const resolved = resolveInclude(quoted[1], filePath || process.cwd(), includeDirs);
            if (!resolved || isEngineStub(resolved) || seen.has(resolved)) {
                continue;
            }
            const impl = siblingImplementation(resolved);
            const including = filePath ? node_path_1.default.resolve(filePath) : null;
            const ownHeader = Boolean(impl && including && node_path_1.default.resolve(impl) === including);
            if (!ownHeader) {
                pushModuleInclude(options, resolved, impl);
                continue;
            }
            seen.add(resolved);
            const inner = node_fs_1.default.readFileSync(resolved, "utf8");
            out.push(preprocess(inner, resolved, { ...options, seen }));
            continue;
        }
        if (/^\s*#\s*include\s+</.test(line)) {
            continue;
        }
        out.push(line);
    }
    return out.join("\n");
}
