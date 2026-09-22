"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLARE_TYPE_DOCS = exports.FLARE_CANONICAL_TYPES = exports.symbolsIn = exports.signatureAt = exports.isFlareDocument = exports.hoverAt = exports.diagnoseFlare = exports.completionsAt = exports.analyzeFlare = exports.FLARE_IDENT = exports.FLARE_TYPE_ALIASES = exports.parseFlare = exports.emitFlareLuau = exports.emitFlareHeader = exports.emitFlare = void 0;
exports.isFlareFile = isFlareFile;
exports.isGeneratedHeader = isGeneratedHeader;
exports.collectFlareFiles = collectFlareFiles;
exports.compileFlareFile = compileFlareFile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const emit_js_1 = require("./emit.js");
const parse_js_1 = require("./parse.js");
var emit_js_2 = require("./emit.js");
Object.defineProperty(exports, "emitFlare", { enumerable: true, get: function () { return emit_js_2.emitFlare; } });
Object.defineProperty(exports, "emitFlareHeader", { enumerable: true, get: function () { return emit_js_2.emitFlareHeader; } });
Object.defineProperty(exports, "emitFlareLuau", { enumerable: true, get: function () { return emit_js_2.emitFlareLuau; } });
var parse_js_2 = require("./parse.js");
Object.defineProperty(exports, "parseFlare", { enumerable: true, get: function () { return parse_js_2.parseFlare; } });
Object.defineProperty(exports, "FLARE_TYPE_ALIASES", { enumerable: true, get: function () { return parse_js_2.FLARE_TYPE_ALIASES; } });
Object.defineProperty(exports, "FLARE_IDENT", { enumerable: true, get: function () { return parse_js_2.FLARE_IDENT; } });
var language_js_1 = require("./language.js");
Object.defineProperty(exports, "analyzeFlare", { enumerable: true, get: function () { return language_js_1.analyzeFlare; } });
Object.defineProperty(exports, "completionsAt", { enumerable: true, get: function () { return language_js_1.completionsAt; } });
Object.defineProperty(exports, "diagnoseFlare", { enumerable: true, get: function () { return language_js_1.diagnoseFlare; } });
Object.defineProperty(exports, "hoverAt", { enumerable: true, get: function () { return language_js_1.hoverAt; } });
Object.defineProperty(exports, "isFlareDocument", { enumerable: true, get: function () { return language_js_1.isFlareDocument; } });
Object.defineProperty(exports, "signatureAt", { enumerable: true, get: function () { return language_js_1.signatureAt; } });
Object.defineProperty(exports, "symbolsIn", { enumerable: true, get: function () { return language_js_1.symbolsIn; } });
Object.defineProperty(exports, "FLARE_CANONICAL_TYPES", { enumerable: true, get: function () { return language_js_1.FLARE_CANONICAL_TYPES; } });
Object.defineProperty(exports, "FLARE_TYPE_DOCS", { enumerable: true, get: function () { return language_js_1.FLARE_TYPE_DOCS; } });
function isFlareFile(fileName) {
    return node_path_1.default.extname(fileName).toLowerCase() === ".flare";
}
function isGeneratedHeader(filePath) {
    if (node_path_1.default.extname(filePath).toLowerCase() !== ".clh") {
        return false;
    }
    if (!node_fs_1.default.existsSync(filePath)) {
        return false;
    }
    const head = node_fs_1.default.readFileSync(filePath, "utf8").slice(0, 400);
    return /cluaupp generated/i.test(head);
}
function collectFlareFiles(dir, files = []) {
    if (!node_fs_1.default.existsSync(dir)) {
        return files;
    }
    for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
        const full = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectFlareFiles(full, files);
        }
        else if (isFlareFile(entry.name)) {
            files.push(full);
        }
    }
    return files;
}
function compileFlareFile(file, srcDir) {
    const source = node_fs_1.default.readFileSync(file, "utf8");
    const rel = node_path_1.default.relative(srcDir, file).replace(/\\/g, "/");
    const stem = node_path_1.default.basename(file, node_path_1.default.extname(file));
    const schema = (0, parse_js_1.parseFlare)(source, rel, stem);
    const relDir = node_path_1.default.posix.dirname(rel);
    const dir = relDir === "." ? "" : relDir;
    const emit = (0, emit_js_1.emitFlare)(schema, dir);
    return { schema, emit };
}
