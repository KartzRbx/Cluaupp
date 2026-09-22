/** Release / checksum helpers for Roblox Target artifacts. */
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import { pkg } from "../package-info.js";
import { hashBuffer } from "./resolver.js";
import { ROBLOX_TARGET_SCHEMA_VERSION } from "./model.js";

export interface ReleaseChecklist {
	schemaVersion: number;
	generatorVersion: string;
	lockPresent: boolean;
	manifestPresent: boolean;
	checksums: Record<string, string>;
}

export function buildReleaseChecklist(): ReleaseChecklist {
	const lockPath = path.join(projectRoot, "api", "roblox-api.lock.json");
	const manifestPath = path.join(projectRoot, "api", "manifests", "roblox-target.manifest.json");
	const checksums: Record<string, string> = {};
	for (const rel of [
		"include/clpp/generated/enums.clh",
		"include/clpp/datatypes.clh",
		"include/clpp/generated/instances.clh",
		"api/overrides/datatypes.json",
	]) {
		const full = path.join(projectRoot, rel);
		if (fs.existsSync(full)) {
			checksums[rel] = hashBuffer(fs.readFileSync(full));
		}
	}
	return {
		schemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		generatorVersion: pkg.version,
		lockPresent: fs.existsSync(lockPath),
		manifestPresent: fs.existsSync(manifestPath),
		checksums,
	};
}

export function writeApiChangelog(entries: string[], outPath?: string): string {
	const target = outPath || path.join(projectRoot, "api", "CHANGELOG.md");
	const body = [`# Roblox API changelog`, ``, ...entries.map((e) => `- ${e}`), ``].join("\n");
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, body, "utf8");
	return target;
}
