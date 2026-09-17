"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClppSource = void 0;
exports.diagnosticsFor = diagnosticsFor;
exports.syncEditorSupport = syncEditorSupport;
exports.installEditorExtension = installEditorExtension;
exports.installEditorSupport = installEditorSupport;
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_child_process_1 = require("node:child_process");
const package_info_js_1 = require("./package-info.js");
const contract_js_1 = require("./clpp/contract.js");
const runner_js_1 = require("./clpp/runner.js");
const paths_js_1 = require("./clpp/paths.js");
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
        // ignore
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
function writeVscode(root) {
    const settingsPath = node_path_1.default.join(root, ".vscode", "settings.json");
    const current = readJsonObject(settingsPath);
    const associations = {
        ...((current["files.associations"] && typeof current["files.associations"] === "object" && !Array.isArray(current["files.associations"]))
            ? current["files.associations"]
            : {}),
        "*.clpp": "clpp",
        "*.clp": "clpp",
        "*.clh": "clpp",
        "*.server.clpp": "clpp",
        "*.client.clpp": "clpp",
        "*.plugin.clpp": "clpp",
    };
    writeJson(settingsPath, {
        ...current,
        "files.associations": associations,
    });
    const extensionsPath = node_path_1.default.join(root, ".vscode", "extensions.json");
    const extensions = readJsonObject(extensionsPath);
    writeJson(extensionsPath, {
        ...extensions,
        recommendations: uniqueStrings(extensions.recommendations),
        unwantedRecommendations: uniqueStrings(extensions.unwantedRecommendations, ["ms-vscode.cpptools"]),
    });
}
function diagnosticsFor(source, fileName) {
    if (!(0, runner_js_1.hasClpp)()) {
        return [];
    }
    try {
        (0, runner_js_1.compileViaClpp)({ source, fileName: fileName || "input.clpp" });
        return [];
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const match = message.match(/:(\d+):(\d+):\s*(.*)$/);
        if (match) {
            return [{ line: Number(match[1]), col: Number(match[2]), message: match[3], severity: "error" }];
        }
        return [{ line: 1, col: 1, message, severity: "error" }];
    }
}
function syncEditorSupport(root, _config = {}) {
    writeVscode(root);
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
async function installEditorSupport() {
    const local = installEditorExtension();
    if ((0, runner_js_1.hasClpp)()) {
        const result = (0, node_child_process_1.spawnSync)("clpp", ["install"], { encoding: "utf8", windowsHide: true });
        if (result.status === 0) {
            console.log(String(result.stderr || result.stdout || "clpp install ok").trim());
        }
        else {
            console.log("cluaupp:", contract_js_1.CLPP_INSTALL_HINT);
        }
    }
    else {
        console.log("cluaupp:", contract_js_1.CLPP_INSTALL_HINT);
    }
    return { local };
}
exports.isClppSource = paths_js_1.isSourceFile;
