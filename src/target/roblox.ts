import type { RobloxTargetProfile } from "../api/model.js";
import { ROBLOX_TARGET_SCHEMA_VERSION } from "../api/model.js";
import { buildRobloxTargetProfile } from "../api/build-profile.js";

/** Cluaupp-owned run contexts — never push these into CLPP core. */
export type RunContext = "Server" | "Client" | "Plugin" | "Shared";

export const FILE_TAG_TO_CONTEXT: Record<string, RunContext> = {
	".server": "Server",
	".client": "Client",
	".plugin": "Plugin",
};

export function runContextFromFileName(fileName: string): RunContext {
	const lower = fileName.toLowerCase();
	if (lower.includes(".server.")) {
		return "Server";
	}
	if (lower.includes(".client.")) {
		return "Client";
	}
	if (lower.includes(".plugin.")) {
		return "Plugin";
	}
	return "Shared";
}

export interface RobloxProjectModel {
	kind: "roblox";
	rojoProjectPath?: string;
	libsFolderName: "CluauppLibs";
	/** Historical CLPP postprocess name — remapped in Cluaupp only. */
	legacyLibsAlias: "ClppLibs";
}

export function defaultRobloxProject(): RobloxProjectModel {
	return {
		kind: "roblox",
		libsFolderName: "CluauppLibs",
		legacyLibsAlias: "ClppLibs",
	};
}

/**
 * Target-side GetService\<T\> — feature of Cluaupp, not a fixed CLPP language rule.
 * CLPP may emit a generic call; Cluaupp maps T to a service class from the registry.
 */
export function resolveGetServiceType(typeName: string, profile?: RobloxTargetProfile): string | null {
	const p = profile || buildRobloxTargetProfile({ skipValidate: true });
	if (p.services[typeName]) {
		return typeName;
	}
	if (p.classes[typeName]?.service || p.classes[typeName]?.creation.service) {
		return typeName;
	}
	return null;
}

export function targetProfileSummary(): {
	schemaVersion: number;
	target: "roblox";
	classes: number;
	services: number;
} {
	const profile = buildRobloxTargetProfile({ skipValidate: true });
	return {
		schemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		target: "roblox",
		classes: Object.keys(profile.classes).length,
		services: Object.keys(profile.services).length,
	};
}
