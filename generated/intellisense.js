"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clangPath = clangPath;
exports.writeCompileCommands = writeCompileCommands;
exports.writeClangd = writeClangd;
exports.diagnosticsFor = diagnosticsFor;
exports.syncEditorSupport = syncEditorSupport;
exports.installEditorExtension = installEditorExtension;
exports.installEditorSupport = installEditorSupport;
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const parse_js_1 = require("./parse.js");
const preprocess_js_1 = require("./preprocess.js");
const editor_install_js_1 = require("./editor-install.js");
const package_info_js_1 = require("./package-info.js");
function posix(file) {
    return String(file).replace(/\\/g, "/");
}
function collectFiles(dir, files = []) {
    if (!node_fs_1.default.existsSync(dir)) {
        return files;
    }
    for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
        const full = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectFiles(full, files);
        }
        else {
            files.push(full);
        }
    }
    return files;
}
function isCppFile(file) {
    return /\.(cpp|cc|cxx|c|h|hpp|hh)$/i.test(file);
}
function clangCompileArgs(root) {
    const absRoot = posix(node_path_1.default.resolve(root));
    const absInclude = posix(node_path_1.default.join(absRoot, "include"));
    const absSrc = posix(node_path_1.default.join(absRoot, "src"));
    const roblox = posix(node_path_1.default.join(absInclude, "cluaupp", "roblox.hpp"));
    return [
        "-xc++",
        "-std=c++20",
        "-ferror-limit=0",
        "-I" + absInclude,
        "-I" + absSrc,
        "-Iinclude",
        "-Isrc",
        "-include",
        roblox,
    ];
}
function compileCommandEntry(root, file) {
    const absRoot = posix(node_path_1.default.resolve(root));
    const absFile = posix(node_path_1.default.resolve(file));
    return {
        directory: absRoot,
        file: absFile,
        arguments: [clangPath(), ...clangCompileArgs(root), "-c", absFile],
    };
}
function copyDir(from, to) {
    node_fs_1.default.mkdirSync(to, { recursive: true });
    for (const entry of node_fs_1.default.readdirSync(from, { withFileTypes: true })) {
        const src = node_path_1.default.join(from, entry.name);
        const dest = node_path_1.default.join(to, entry.name);
        if (entry.isDirectory()) {
            copyDir(src, dest);
        }
        else {
            node_fs_1.default.copyFileSync(src, dest);
        }
    }
}
function uniqueStrings(...lists) {
    const seen = new Set();
    const out = [];
    for (const list of lists) {
        if (!Array.isArray(list)) {
            continue;
        }
        for (const item of list) {
            if (typeof item === "string" && item && !seen.has(item)) {
                seen.add(item);
                out.push(item);
            }
        }
    }
    return out;
}
function stripCppToolsSettings(current) {
    const next = {};
    for (const [key, value] of Object.entries(current)) {
        if (key === "C_Cpp" || key.startsWith("C_Cpp.")) {
            continue;
        }
        next[key] = value;
    }
    return next;
}
function readJsonObject(file) {
    if (!node_fs_1.default.existsSync(file)) {
        return {};
    }
    try {
        const parsed = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch {
        // ignore corrupt editor json
    }
    return {};
}
function writeJson(file, value) {
    const json = `${JSON.stringify(value, null, "\t")}\n`;
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(file), { recursive: true });
    if (node_fs_1.default.existsSync(file) && node_fs_1.default.readFileSync(file, "utf8") === json) {
        return;
    }
    node_fs_1.default.writeFileSync(file, json, "utf8");
}
function clangdEditorArgs() {
    return [
        "--compile-commands-dir=${workspaceFolder}",
        "--header-insertion=never",
        "--query-driver=**/clang++*,**/clang++.exe,**/g++*,**/g++.exe",
    ];
}
function clangPath() {
    return (0, editor_install_js_1.findClangPlusPlus)() || "clang++";
}
function writeCompileCommands(root, srcDir) {
    const files = collectFiles(srcDir).filter((file) => isCppFile(file)).sort();
    const json = `${JSON.stringify(files.map((file) => compileCommandEntry(root, file)), null, "\t")}\n`;
    const dest = node_path_1.default.join(root, "compile_commands.json");
    if (node_fs_1.default.existsSync(dest) && node_fs_1.default.readFileSync(dest, "utf8") === json) {
        return false;
    }
    node_fs_1.default.writeFileSync(dest, json, "utf8");
    return true;
}
function writeClangd(root) {
    const flags = clangCompileArgs(root)
        .map((flag) => `    - ${flag}`)
        .join("\n");
    const contents = `CompileFlags:
  CompilationDatabase: .
  Add:
${flags}

Diagnostics:
  Suppress: '*'

---
If:
  PathMatch: .*\\.(cpp|cc|cxx|c|h|hpp|hh)$
CompileFlags:
  Add:
    - -xc++

---
If:
  PathMatch: (out|libs)/.*
Index:
  Background: Skip
`;
    const dest = node_path_1.default.join(root, ".clangd");
    if (node_fs_1.default.existsSync(dest) && node_fs_1.default.readFileSync(dest, "utf8") === contents) {
        return false;
    }
    node_fs_1.default.writeFileSync(dest, contents, "utf8");
    return true;
}
function writeVscode(root) {
    const settingsPath = node_path_1.default.join(root, ".vscode", "settings.json");
    const current = readJsonObject(settingsPath);
    const associations = {
        ...((current["files.associations"] && typeof current["files.associations"] === "object" && !Array.isArray(current["files.associations"]))
            ? current["files.associations"]
            : {}),
        "*.hpp": "cpp",
        "*.h": "cpp",
        "*.server.cpp": "cpp",
        "*.client.cpp": "cpp",
        "*.plugin.cpp": "cpp",
        "*.legacy.cpp": "cpp",
        "*.legacy.server.cpp": "cpp",
        "*.legacy.client.cpp": "cpp",
    };
    writeJson(settingsPath, {
        ...stripCppToolsSettings(current),
        "clangd.enable": true,
        "clangd.arguments": clangdEditorArgs(),
        "files.associations": associations,
    });
    const extensionsPath = node_path_1.default.join(root, ".vscode", "extensions.json");
    const extensions = readJsonObject(extensionsPath);
    writeJson(extensionsPath, {
        ...extensions,
        recommendations: uniqueStrings(extensions.recommendations, ["llvm-vs-code-extensions.vscode-clangd"]),
        unwantedRecommendations: uniqueStrings(extensions.unwantedRecommendations, ["ms-vscode.cpptools"]),
    });
    const props = node_path_1.default.join(root, ".vscode", "c_cpp_properties.json");
    if (node_fs_1.default.existsSync(props)) {
        node_fs_1.default.unlinkSync(props);
    }
}
function diagnosticsFor(source, fileName, options = {}) {
    try {
        const prepared = options.filePath ? (0, preprocess_js_1.preprocess)(source, options.filePath, options) : source;
        (0, parse_js_1.parse)(prepared, fileName || "input.cpp");
        return [];
    }
    catch (err) {
        const error = err;
        const message = error.message ? String(error.message) : "parse error";
        const match = message.match(/:(\d+):(\d+):\s*(.*)$/);
        if (match) {
            return [{ line: Number(match[1]), col: Number(match[2]), message: match[3], severity: "error" }];
        }
        return [{ line: error.line || 1, col: error.col || 1, message, severity: "error" }];
    }
}
function syncEditorSupport(root, config = {}) {
    const srcDir = node_path_1.default.join(root, config.rootDir || "src");
    if (node_fs_1.default.existsSync(srcDir)) {
        writeCompileCommands(root, srcDir);
    }
    writeClangd(root);
    writeVscode(root);
    const flags = ["-xc++", "-std=c++20", "-ferror-limit=0", "-Iinclude", "-Isrc", "-include", "include/cluaupp/roblox.hpp"].join("\n") + "\n";
    const flagsFile = node_path_1.default.join(root, "compile_flags.txt");
    if (!node_fs_1.default.existsSync(flagsFile) || node_fs_1.default.readFileSync(flagsFile, "utf8") !== flags) {
        node_fs_1.default.writeFileSync(flagsFile, flags, "utf8");
    }
}
function installEditorExtension(cluauppRoot = package_info_js_1.projectRoot) {
    const from = node_path_1.default.join(cluauppRoot, "editors", "vscode");
    if (!node_fs_1.default.existsSync(from)) {
        return [];
    }
    const id = `kartzdev.cluaupp-diagnostics-${package_info_js_1.pkg.version}`;
    const homes = [node_path_1.default.join(node_os_1.default.homedir(), ".cursor", "extensions"), node_path_1.default.join(node_os_1.default.homedir(), ".vscode", "extensions")];
    const installed = [];
    for (const home of homes) {
        if (!node_fs_1.default.existsSync(node_path_1.default.dirname(home))) {
            continue;
        }
        node_fs_1.default.mkdirSync(home, { recursive: true });
        const dest = node_path_1.default.join(home, id);
        copyDir(from, dest);
        node_fs_1.default.writeFileSync(node_path_1.default.join(dest, "cluaupp.root"), node_path_1.default.resolve(cluauppRoot), "utf8");
        installed.push(dest);
    }
    return installed;
}
async function installEditorSupport(cluauppRoot = package_info_js_1.projectRoot) {
    const local = installEditorExtension(cluauppRoot);
    const llvm = (0, editor_install_js_1.ensureLlvm)();
    (0, editor_install_js_1.reportInstall)(llvm, "LLVM clang++");
    const clangd = await (0, editor_install_js_1.installMarketplaceExtension)(editor_install_js_1.CLANGD_ID, "clangd (LLVM)");
    (0, editor_install_js_1.reportInstall)(clangd, "clangd");
    console.log("cluaupp: C++ completion is clangd — reload the editor (Ctrl+Shift+P → Developer: Reload Window)");
    return { local, llvm, clangd };
}
