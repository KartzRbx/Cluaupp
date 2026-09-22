"use strict";
/**
 * Generate project documentation from DataModel + graph + Flare + advice.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectDocs = generateProjectDocs;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const datamodel_js_1 = require("./datamodel.js");
const project_graph_js_1 = require("./project-graph.js");
const flare_version_js_1 = require("./flare-version.js");
const paths_js_1 = require("../clpp/paths.js");
const optimizer_advise_js_1 = require("./optimizer-advise.js");
function generateProjectDocs(projectRoot, rootDir = "src") {
    const dm = (0, datamodel_js_1.buildDatamodelProfile)(projectRoot);
    const graph = (0, project_graph_js_1.buildProjectGraph)(projectRoot, rootDir);
    const flare = (0, flare_version_js_1.checkFlareVersions)(projectRoot, rootDir);
    const srcDir = node_path_1.default.join(projectRoot, rootDir);
    const files = node_fs_1.default.existsSync(srcDir) ? (0, paths_js_1.collectSources)(srcDir) : [];
    const advice = [];
    for (const file of files) {
        const rel = node_path_1.default.relative(projectRoot, file).replace(/\\/g, "/");
        for (const a of (0, optimizer_advise_js_1.adviseOptimizer)(node_fs_1.default.readFileSync(file, "utf8"), rel)) {
            advice.push(`- **${a.target}** (${a.kind}): ${a.message}`);
        }
    }
    const paths = dm
        ? Object.keys(dm.byPath)
            .filter((p) => p !== "DataModel")
            .sort()
            .map((p) => `- \`${p}\` — ${dm.byPath[p].className}`)
            .join("\n")
        : "_no default.project.json_";
    const markdown = [
        `# Cluaupp project docs`,
        ``,
        `Generated: ${new Date().toISOString()}`,
        ``,
        `## DataModel`,
        ``,
        paths,
        ``,
        `## Modules (${graph.nodes.length})`,
        ``,
        graph.nodes.map((n) => `- \`${n}\``).join("\n") || "_none_",
        ``,
        `## Dependencies`,
        ``,
        graph.edges.map((e) => `- \`${e.from}\` → \`${e.to}\``).join("\n") || "_none_",
        ``,
        graph.cycles.length ? `### Cycles\n\n${graph.cycles.map((c) => `- ${c.join(" → ")}`).join("\n")}\n` : "",
        `## Flare contracts`,
        ``,
        flare.files.map((f) => `- \`${f.file}\` name=\`${f.name}\` version=${f.version ?? "unset"}`).join("\n") || "_none_",
        ``,
        `## Optimizer advice`,
        ``,
        advice.slice(0, 40).join("\n") || "_none_",
        ``,
    ].join("\n");
    const outDir = node_path_1.default.join(projectRoot, ".cluaupp");
    node_fs_1.default.mkdirSync(outDir, { recursive: true });
    const outPath = node_path_1.default.join(outDir, "PROJECT.md");
    node_fs_1.default.writeFileSync(outPath, markdown, "utf8");
    return { outPath, markdown };
}
