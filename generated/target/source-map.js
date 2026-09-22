"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSourceMap = writeSourceMap;
/** Minimal source map: CL++ path ↔ emitted Luau (1:1 file mapping for v1). */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function writeSourceMap(opts) {
    const map = {
        version: 1,
        file: node_path_1.default.basename(opts.outLuauPath),
        sourceRoot: opts.projectRoot.replace(/\\/g, "/"),
        sources: [opts.sourceClppRel.replace(/\\/g, "/")],
        mappings: "AAAA", // identity stub — refine when clpp emits VLQ maps
        cluaupp: {
            source: opts.sourceClppRel.replace(/\\/g, "/"),
            generated: node_path_1.default.relative(opts.projectRoot, opts.outLuauPath).replace(/\\/g, "/"),
        },
    };
    const mapPath = opts.outLuauPath + ".map.json";
    node_fs_1.default.writeFileSync(mapPath, JSON.stringify(map, null, "\t") + "\n", "utf8");
    return mapPath;
}
