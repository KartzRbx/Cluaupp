/**
 * Generate project documentation from DataModel + graph + Flare + advice.
 */

import fs from "node:fs";
import path from "node:path";
import { buildDatamodelProfile } from "./datamodel.js";
import { buildProjectGraph } from "./project-graph.js";
import { checkFlareVersions } from "./flare-version.js";
import { collectSources } from "../clpp/paths.js";
import { adviseOptimizer } from "./optimizer-advise.js";

export function generateProjectDocs(projectRoot: string, rootDir = "src"): { outPath: string; markdown: string } {
	const dm = buildDatamodelProfile(projectRoot);
	const graph = buildProjectGraph(projectRoot, rootDir);
	const flare = checkFlareVersions(projectRoot, rootDir);
	const srcDir = path.join(projectRoot, rootDir);
	const files = fs.existsSync(srcDir) ? collectSources(srcDir) : [];
	const advice: string[] = [];
	for (const file of files) {
		const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
		for (const a of adviseOptimizer(fs.readFileSync(file, "utf8"), rel)) {
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

	const outDir = path.join(projectRoot, ".cluaupp");
	fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, "PROJECT.md");
	fs.writeFileSync(outPath, markdown, "utf8");
	return { outPath, markdown };
}
