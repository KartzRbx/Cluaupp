"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStudioApi = loadStudioApi;
const loader_js_1 = require("../loader.js");
/** Studio --api JSON (same shape family as Mini dump when exported). */
function loadStudioApi(filePath) {
    return (0, loader_js_1.loadJsonFile)("studio-api", filePath);
}
