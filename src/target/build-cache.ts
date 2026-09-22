/**
 * Incremental compile cache + bounded parallel job runner.
 * Cache lives under `.cluaupp/compile-cache/` (gitignored via `.cluaupp/`).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const COMPILE_CACHE_SCHEMA = 1 as const;

export interface CachedArtifact {
	name: string;
	contents: string;
}

export interface CachedJob {
	rel: string;
	sourceHash: string;
	files: CachedArtifact[];
	stale: string[];
}

export interface CompileCacheIndex {
	schemaVersion: typeof COMPILE_CACHE_SCHEMA;
	/** rel → sourceHash */
	entries: Record<string, string>;
}

export function compileCacheDir(projectRoot: string): string {
	return path.join(projectRoot, ".cluaupp", "compile-cache");
}

export function hashText(text: string): string {
	return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function fingerprintSource(source: string, configKey: string): string {
	return hashText(`${configKey}\n${source}`);
}

function indexPath(projectRoot: string): string {
	return path.join(compileCacheDir(projectRoot), "index.json");
}

function jobPath(projectRoot: string, rel: string): string {
	const safe = rel.replace(/[\\/]/g, "__");
	return path.join(compileCacheDir(projectRoot), `${safe}.json`);
}

export function loadCompileCacheIndex(projectRoot: string): CompileCacheIndex {
	const file = indexPath(projectRoot);
	if (!fs.existsSync(file)) {
		return { schemaVersion: COMPILE_CACHE_SCHEMA, entries: {} };
	}
	try {
		const raw = JSON.parse(fs.readFileSync(file, "utf8")) as CompileCacheIndex;
		if (!raw || typeof raw.entries !== "object") {
			return { schemaVersion: COMPILE_CACHE_SCHEMA, entries: {} };
		}
		return { schemaVersion: COMPILE_CACHE_SCHEMA, entries: raw.entries };
	} catch {
		return { schemaVersion: COMPILE_CACHE_SCHEMA, entries: {} };
	}
}

export function saveCompileCacheIndex(projectRoot: string, index: CompileCacheIndex): void {
	const dir = compileCacheDir(projectRoot);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(indexPath(projectRoot), JSON.stringify(index, null, "\t") + "\n", "utf8");
}

export function readCachedJob(projectRoot: string, rel: string, sourceHash: string): CachedJob | null {
	const index = loadCompileCacheIndex(projectRoot);
	if (index.entries[rel] !== sourceHash) {
		return null;
	}
	const file = jobPath(projectRoot, rel);
	if (!fs.existsSync(file)) {
		return null;
	}
	try {
		const job = JSON.parse(fs.readFileSync(file, "utf8")) as CachedJob;
		if (!job || job.sourceHash !== sourceHash || !Array.isArray(job.files)) {
			return null;
		}
		return job;
	} catch {
		return null;
	}
}

export function writeCachedJob(projectRoot: string, job: CachedJob): void {
	const dir = compileCacheDir(projectRoot);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(jobPath(projectRoot, job.rel), JSON.stringify(job) + "\n", "utf8");
	const index = loadCompileCacheIndex(projectRoot);
	index.entries[job.rel] = job.sourceHash;
	saveCompileCacheIndex(projectRoot, index);
}

/** Bounded concurrency over async work items. */
export async function mapPool<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const limit = Math.max(1, Math.min(concurrency, items.length || 1));
	const results = new Array<R>(items.length);
	let next = 0;
	async function worker(): Promise<void> {
		while (true) {
			const i = next++;
			if (i >= items.length) return;
			results[i] = await fn(items[i], i);
		}
	}
	await Promise.all(Array.from({ length: limit }, () => worker()));
	return results;
}

export function defaultJobCount(): number {
	const env = Number(process.env.CLUAUPP_JOBS || process.env.CLPP_JOBS || "");
	if (Number.isFinite(env) && env > 0) {
		return Math.floor(env);
	}
	return Math.max(1, Math.min(8, os.cpus()?.length || 4));
}
