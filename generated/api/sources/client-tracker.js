"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadClientTrackerDump = loadClientTrackerDump;
const loader_js_1 = require("../loader.js");
/**
 * Optional Client Tracker adapter (non-authoritative early-diff source).
 * Pass a local API-Dump.json / Full-API-Dump.json checkout path.
 */
function loadClientTrackerDump(filePath) {
    return (0, loader_js_1.loadJsonFile)("client-tracker", filePath);
}
