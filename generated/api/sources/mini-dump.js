"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMiniDump = loadMiniDump;
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../../package-info.js");
const loader_js_1 = require("../loader.js");
function loadMiniDump(filePath) {
    const target = filePath || node_path_1.default.join(package_info_js_1.projectRoot, "data", "Mini-API-Dump.json");
    const loaded = (0, loader_js_1.loadJsonFile)("mini-api-dump", target);
    if (!Array.isArray(loaded.data.Classes) || !Array.isArray(loaded.data.Enums)) {
        throw new Error("Mini-API-Dump.json missing Classes/Enums arrays");
    }
    return loaded;
}
