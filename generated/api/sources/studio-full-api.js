"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStudioFullApi = loadStudioFullApi;
const loader_js_1 = require("../loader.js");
/** Studio --fullApi JSON export. */
function loadStudioFullApi(filePath) {
    return (0, loader_js_1.loadJsonFile)("studio-full-api", filePath);
}
