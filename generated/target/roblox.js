"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_TAG_TO_CONTEXT = void 0;
exports.runContextFromFileName = runContextFromFileName;
exports.defaultRobloxProject = defaultRobloxProject;
exports.resolveGetServiceType = resolveGetServiceType;
exports.targetProfileSummary = targetProfileSummary;
const model_js_1 = require("../api/model.js");
const build_profile_js_1 = require("../api/build-profile.js");
exports.FILE_TAG_TO_CONTEXT = {
    ".server": "Server",
    ".client": "Client",
    ".plugin": "Plugin",
};
function runContextFromFileName(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes(".server.")) {
        return "Server";
    }
    if (lower.includes(".client.")) {
        return "Client";
    }
    if (lower.includes(".plugin.")) {
        return "Plugin";
    }
    return "Shared";
}
function defaultRobloxProject() {
    return {
        kind: "roblox",
        libsFolderName: "CluauppLibs",
        legacyLibsAlias: "ClppLibs",
    };
}
/**
 * Target-side GetService\<T\> — feature of Cluaupp, not a fixed CLPP language rule.
 * CLPP may emit a generic call; Cluaupp maps T to a service class from the registry.
 */
function resolveGetServiceType(typeName, profile) {
    const p = profile || (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    if (p.services[typeName]) {
        return typeName;
    }
    if (p.classes[typeName]?.service || p.classes[typeName]?.creation.service) {
        return typeName;
    }
    return null;
}
function targetProfileSummary() {
    const profile = (0, build_profile_js_1.buildRobloxTargetProfile)({ skipValidate: true });
    return {
        schemaVersion: model_js_1.ROBLOX_TARGET_SCHEMA_VERSION,
        target: "roblox",
        classes: Object.keys(profile.classes).length,
        services: Object.keys(profile.services).length,
    };
}
