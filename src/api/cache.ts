import path from "node:path";
import fs from "node:fs";
import { projectRoot } from "../package-info.js";
import { hashBuffer } from "../api/resolver.js";
import { overridesHash } from "../api/loader.js";
import { buildRobloxTargetProfile, profileContentHash } from "../api/build-profile.js";

export interface CacheKey {
	sourceHash: string;
	overridesHash: string;
	generatorVersion: string;
}

export function computeCacheKey(generatorVersion: string, dumpPath?: string): CacheKey {
	const profile = buildRobloxTargetProfile({ dumpPath, skipValidate: true });
	return {
		sourceHash: profile.sources["mini-api-dump"]?.hash || profileContentHash(profile),
		overridesHash: overridesHash(),
		generatorVersion,
	};
}

export function cacheDir(): string {
	return path.join(projectRoot, "api", ".cache");
}

export function readCache<T>(key: string): T | null {
	const file = path.join(cacheDir(), `${key}.json`);
	if (!fs.existsSync(file)) {
		return null;
	}
	return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeCache(key: string, value: unknown): void {
	fs.mkdirSync(cacheDir(), { recursive: true });
	const file = path.join(cacheDir(), `${key}.json`);
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, `${JSON.stringify(value)}\n`, "utf8");
	fs.renameSync(tmp, file);
}

export function cacheKeyHash(parts: CacheKey): string {
	return hashBuffer(`${parts.sourceHash}:${parts.overridesHash}:${parts.generatorVersion}`);
}
