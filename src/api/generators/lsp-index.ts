/**
 * Stable LSP metadata index for the CL++ Language Server.
 * Cluaupp writes JSON; CLPP reads it. No LSP protocol here.
 */
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../../package-info.js";
import { pkg } from "../../package-info.js";
import type { RobloxTargetProfile } from "../model.js";
import { ROBLOX_TARGET_SCHEMA_VERSION } from "../model.js";
import { typeToClpp } from "../resolver.js";
import { buildRegistry, flattenMembers } from "../registry.js";

export const LSP_INDEX_SCHEMA_VERSION = 1 as const;

export interface LspMemberIndex {
	kind: "property" | "method" | "event" | "callback";
	name: string;
	detail?: string;
	threadSafety?: string;
}

export interface LspClassIndex {
	name: string;
	superclass: string | null;
	service: boolean;
	creatable: boolean;
	members: LspMemberIndex[];
}

export interface LspIndexDocument {
	schemaVersion: typeof LSP_INDEX_SCHEMA_VERSION;
	targetSchemaVersion: typeof ROBLOX_TARGET_SCHEMA_VERSION;
	generatorVersion: string;
	classes: Record<string, LspClassIndex>;
	services: string[];
	enums: string[];
	datatypes: string[];
	globals: string[];
}

export function buildLspIndex(profile: RobloxTargetProfile): LspIndexDocument {
	const registry = buildRegistry(profile);
	const classes: Record<string, LspClassIndex> = {};
	for (const name of Object.keys(profile.classes).sort()) {
		const cls = profile.classes[name];
		const flat = flattenMembers(registry, name);
		const members: LspMemberIndex[] = [];
		for (const prop of flat.properties) {
			members.push({
				kind: "property",
				name: prop.name,
				detail: typeToClpp(prop.valueType),
				threadSafety: prop.threadSafety,
			});
		}
		for (const method of flat.methods) {
			members.push({
				kind: "method",
				name: method.name,
				detail: `(${method.parameters.map((p) => typeToClpp(p.type)).join(", ")})`,
				threadSafety: method.threadSafety,
			});
		}
		for (const event of flat.events) {
			members.push({
				kind: "event",
				name: event.name,
				detail: event.parameters.map((p) => typeToClpp(p.type)).join(", "),
				threadSafety: event.threadSafety,
			});
		}
		for (const cb of cls.callbacks) {
			members.push({ kind: "callback", name: cb.name, threadSafety: cb.threadSafety });
		}
		classes[name] = {
			name,
			superclass: cls.superclass,
			service: cls.service || cls.creation.service,
			creatable: cls.creatable || cls.creation.creatable,
			members,
		};
	}
	return {
		schemaVersion: LSP_INDEX_SCHEMA_VERSION,
		targetSchemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		generatorVersion: pkg.version,
		classes,
		services: Object.keys(profile.services).sort(),
		enums: Object.keys(profile.enums).sort(),
		datatypes: Object.keys(profile.datatypes).sort(),
		globals: Object.keys(profile.globals).sort(),
	};
}

export function writeLspIndex(
	profile: RobloxTargetProfile,
	outPath = path.join(projectRoot, "api", "generated", "lsp-index.json"),
): string {
	const doc = buildLspIndex(profile);
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	const tmp = `${outPath}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, `${JSON.stringify(doc)}\n`, "utf8");
	fs.renameSync(tmp, outPath);
	return outPath;
}
