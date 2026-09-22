"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilityProfilePath = capabilityProfilePath;
exports.writeCapabilityProfile = writeCapabilityProfile;
exports.loadCapabilityProfile = loadCapabilityProfile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
const capabilities_js_1 = require("./capabilities.js");
function capabilityProfilePath() {
    return node_path_1.default.join(package_info_js_1.projectRoot, "api", "generated", "capability-profile.json");
}
function writeCapabilityProfile(profile = (0, capabilities_js_1.builtinCapabilityProfile)()) {
    const out = capabilityProfilePath();
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(out), { recursive: true });
    const tmp = `${out}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, `${JSON.stringify(profile, null, "\t")}\n`, "utf8");
    node_fs_1.default.renameSync(tmp, out);
    return out;
}
function loadCapabilityProfile() {
    const file = capabilityProfilePath();
    if (!node_fs_1.default.existsSync(file)) {
        return (0, capabilities_js_1.builtinCapabilityProfile)();
    }
    return JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
}
