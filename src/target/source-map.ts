/** Minimal source map: CL++ path ↔ emitted Luau (1:1 file mapping for v1). */
import fs from "node:fs";
import path from "node:path";

export interface CluauppSourceMap {
	version: 1;
	file: string;
	sourceRoot: string;
	sources: string[];
	mappings: string;
	cluaupp: {
		source: string;
		generated: string;
	};
}

export function writeSourceMap(opts: {
	outLuauPath: string;
	sourceClppRel: string;
	projectRoot: string;
}): string {
	const map: CluauppSourceMap = {
		version: 1,
		file: path.basename(opts.outLuauPath),
		sourceRoot: opts.projectRoot.replace(/\\/g, "/"),
		sources: [opts.sourceClppRel.replace(/\\/g, "/")],
		mappings: "AAAA", // identity stub — refine when clpp emits VLQ maps
		cluaupp: {
			source: opts.sourceClppRel.replace(/\\/g, "/"),
			generated: path.relative(opts.projectRoot, opts.outLuauPath).replace(/\\/g, "/"),
		},
	};
	const mapPath = opts.outLuauPath + ".map.json";
	fs.writeFileSync(mapPath, JSON.stringify(map, null, "\t") + "\n", "utf8");
	return mapPath;
}
