/** Flare remote versioning — detect schema version drift across .flare files. */
import fs from "node:fs";
import path from "node:path";
import { collectFlareFiles, parseFlare } from "../flare/index.js";
import type { PlatformDiagnostic } from "./diagnostics.js";

export interface FlareVersionReport {
	files: Array<{ file: string; name: string; version: number | null }>;
	conflicts: PlatformDiagnostic[];
}

function readVersion(source: string, parsedVersion?: number): number | null {
	if (typeof parsedVersion === "number" && Number.isFinite(parsedVersion)) {
		return parsedVersion;
	}
	const m =
		source.match(/^\s*version\s+(\d+)\s*;?/m) ||
		source.match(/^\s*opt\s+version\s*=\s*(\d+)/im) ||
		source.match(/^\s*#\s*version\s+(\d+)/m);
	return m ? Number(m[1]) : null;
}

export function checkFlareVersions(projectRoot: string, rootDir = "src"): FlareVersionReport {
	const srcDir = path.join(projectRoot, rootDir);
	const files = fs.existsSync(srcDir) ? collectFlareFiles(srcDir) : [];
	const byName = new Map<string, Array<{ file: string; version: number | null }>>();
	const listed: FlareVersionReport["files"] = [];

	for (const file of files) {
		const source = fs.readFileSync(file, "utf8");
		const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
		let name = path.basename(file, ".flare");
		let parsedVersion: number | undefined;
		try {
			const parsed = parseFlare(source, rel, name);
			name = parsed.name || name;
			parsedVersion = parsed.version;
		} catch {
			/* parse may fail on partial */
		}
		const version = readVersion(source, parsedVersion);
		listed.push({ file: rel, name, version });
		if (!byName.has(name)) byName.set(name, []);
		byName.get(name)!.push({ file: rel, version });
	}

	const conflicts: PlatformDiagnostic[] = [];
	for (const [name, entries] of byName) {
		const versions = new Set(entries.map((e) => e.version).filter((v) => v !== null));
		if (versions.size > 1) {
			conflicts.push({
				code: "CLUAU_NET_VERSION",
				message: `Flare contract "${name}" has conflicting versions: ${[...versions].join(", ")} across ${entries.map((e) => e.file).join(", ")}`,
				line: 1,
				column: 1,
				severity: "error",
			});
		}
	}
	return { files: listed, conflicts };
}
