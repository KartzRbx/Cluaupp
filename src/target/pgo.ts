/**
 * Profile-Guided Optimization (PGO) — format, load, Studio ingest.
 * cluaupp.profile.json weights optimizer advice toward hot symbols.
 */

import fs from "node:fs";
import path from "node:path";
import type { OptimizeAdvice } from "./optimizer-advise.js";

export const PGO_SCHEMA_VERSION = 1 as const;

export interface CluauppProfile {
	schemaVersion: typeof PGO_SCHEMA_VERSION;
	generatedAt?: string;
	/** Symbol / function name → call counts (or relative weight). */
	hot: Record<string, number>;
	/** Optional struct names observed as hot. */
	structs?: Record<string, number>;
}

/** One Studio / playtest hit — JSONL or JSON array. */
export interface ProfileEvent {
	symbol: string;
	kind?: "hot" | "struct";
	count?: number;
}

export function defaultProfilePath(projectRoot: string): string {
	return path.join(projectRoot, "cluaupp.profile.json");
}

export function loadProfile(file: string): CluauppProfile | null {
	if (!fs.existsSync(file)) {
		return null;
	}
	try {
		const raw = JSON.parse(fs.readFileSync(file, "utf8")) as CluauppProfile;
		if (!raw || typeof raw.hot !== "object") {
			return null;
		}
		return { schemaVersion: PGO_SCHEMA_VERSION, hot: raw.hot, structs: raw.structs, generatedAt: raw.generatedAt };
	} catch {
		return null;
	}
}

/** Write an empty / template profile for games to fill from Studio logging. */
export function writeProfileTemplate(projectRoot: string): string {
	const file = defaultProfilePath(projectRoot);
	const template: CluauppProfile = {
		schemaVersion: PGO_SCHEMA_VERSION,
		generatedAt: new Date().toISOString(),
		hot: {
			CalculateDamage: 0,
			EnemyUpdate: 0,
		},
		structs: {
			EnemyState: 0,
		},
	};
	fs.writeFileSync(file, JSON.stringify(template, null, "\t") + "\n", "utf8");
	return file;
}

function parseEvents(raw: string): ProfileEvent[] {
	const trimmed = raw.trim();
	if (!trimmed) return [];
	if (trimmed.startsWith("[")) {
		const arr = JSON.parse(trimmed) as unknown;
		if (!Array.isArray(arr)) return [];
		return arr.filter((e) => e && typeof (e as ProfileEvent).symbol === "string") as ProfileEvent[];
	}
	if (trimmed.startsWith("{") && !trimmed.includes("\n")) {
		const one = JSON.parse(trimmed) as Record<string, unknown>;
		if (typeof one.symbol === "string") {
			return [one as unknown as ProfileEvent];
		}
		if (one.hot && typeof one.hot === "object") {
			return Object.entries(one.hot as Record<string, number>).map(([symbol, count]) => ({
				symbol,
				kind: "hot" as const,
				count: Number(count) || 0,
			}));
		}
	}
	const events: ProfileEvent[] = [];
	for (const line of trimmed.split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		try {
			const e = JSON.parse(t) as ProfileEvent;
			if (e && typeof e.symbol === "string") events.push(e);
		} catch {
			/* skip bad line */
		}
	}
	return events;
}

/** Merge Studio/playtest events into cluaupp.profile.json (additive counts). */
export function ingestProfile(
	projectRoot: string,
	eventsPath: string,
): { profilePath: string; profile: CluauppProfile; merged: number } {
	const eventsFile = path.resolve(eventsPath);
	if (!fs.existsSync(eventsFile)) {
		throw new Error(`cluaupp profile ingest: missing ${eventsFile}`);
	}
	const events = parseEvents(fs.readFileSync(eventsFile, "utf8"));
	const profilePath = defaultProfilePath(projectRoot);
	const existing = loadProfile(profilePath) || {
		schemaVersion: PGO_SCHEMA_VERSION,
		hot: {},
		structs: {},
	};
	const hot = { ...(existing.hot || {}) };
	const structs = { ...(existing.structs || {}) };
	let merged = 0;
	for (const e of events) {
		const n = typeof e.count === "number" && Number.isFinite(e.count) ? e.count : 1;
		if (e.kind === "struct") {
			structs[e.symbol] = (structs[e.symbol] || 0) + n;
		} else {
			hot[e.symbol] = (hot[e.symbol] || 0) + n;
		}
		merged++;
	}
	const profile: CluauppProfile = {
		schemaVersion: PGO_SCHEMA_VERSION,
		generatedAt: new Date().toISOString(),
		hot,
		structs,
	};
	fs.writeFileSync(profilePath, JSON.stringify(profile, null, "\t") + "\n", "utf8");
	return { profilePath, profile, merged };
}

export function rankAdvice(advice: OptimizeAdvice[], profile: CluauppProfile | null): OptimizeAdvice[] {
	if (!profile) {
		return advice;
	}
	return [...advice]
		.sort((a, b) => {
			const wa = profile.hot[a.target] || profile.structs?.[a.target] || 0;
			const wb = profile.hot[b.target] || profile.structs?.[b.target] || 0;
			return wb - wa;
		})
		.map((a) => {
			const w = profile.hot[a.target] || profile.structs?.[a.target];
			if (!w) return a;
			return {
				...a,
				message: `${a.message} [PGO weight=${w}]`,
				severity: w > 1000 ? "warning" : a.severity,
			};
		});
}
