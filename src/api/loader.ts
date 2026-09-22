import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import { hashBuffer } from "./resolver.js";
import type { OverrideEntry, SourceMeta } from "./model.js";

export interface LoadedSource<T = unknown> {
	meta: SourceMeta;
	data: T;
}

export function loadJsonFile<T>(id: string, filePath: string): LoadedSource<T> {
	const absolute = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
	if (!fs.existsSync(absolute)) {
		throw new Error(`API source not found: ${absolute}`);
	}
	const raw = fs.readFileSync(absolute);
	const text = raw.toString("utf8");
	const data = JSON.parse(text) as T;
	return {
		meta: {
			id,
			path: absolute,
			hash: hashBuffer(raw),
			loadedAt: new Date().toISOString(),
			version: typeof (data as { Version?: unknown }).Version !== "undefined"
				? (data as { Version: string | number }).Version
				: undefined,
		},
		data,
	};
}

export function readOverrideFile<T extends Record<string, unknown>>(
	relativeName: string,
): { meta: OverrideEntry | null; data: T } {
	const filePath = path.join(projectRoot, "api", "overrides", relativeName);
	if (!fs.existsSync(filePath)) {
		return { meta: null, data: {} as T };
	}
	const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as T & { _meta?: OverrideEntry };
	const meta = parsed._meta || null;
	const { _meta: _, ...rest } = parsed as T & { _meta?: OverrideEntry };
	return { meta, data: rest as T };
}

export function overridesHash(): string {
	const dir = path.join(projectRoot, "api", "overrides");
	if (!fs.existsSync(dir)) {
		return hashBuffer("");
	}
	const parts: string[] = [];
	for (const name of fs.readdirSync(dir).sort()) {
		if (!name.endsWith(".json")) {
			continue;
		}
		parts.push(name, fs.readFileSync(path.join(dir, name), "utf8"));
	}
	return hashBuffer(parts.join("\n"));
}
