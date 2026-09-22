"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStudioApiV2 = loadStudioApiV2;
const loader_js_1 = require("../loader.js");
/**
 * Studio --apiV2 JSON export — preferred canonical schema when available.
 * Until a fixture is checked in, callers may pass a local Studio dump path.
 */
function loadStudioApiV2(filePath) {
    return (0, loader_js_1.loadJsonFile)("studio-api-v2", filePath);
}
