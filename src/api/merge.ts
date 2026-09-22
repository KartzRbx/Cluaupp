import type {
	CanonicalType,
	ConstructorDefinition,
	DatatypeDefinition,
	GlobalDefinition,
	LibraryDefinition,
	MethodDefinition,
	OverrideEntry,
	ParameterDefinition,
	RobloxTargetProfile,
} from "./model.js";
import { mapNamedTypeLike, parseClppTypeString } from "./type-parse.js";

export interface DatatypeOverrideFile {
	_meta?: OverrideEntry;
	datatypes?: Record<string, RawDatatypeOverride>;
}

export interface RawDatatypeOverride {
	summary?: string;
	fields?: string[];
	ctors?: string[][];
	statics?: string[];
	staticMethods?: Array<[string, string, string[]]>;
	methods?: Array<[string, string, string[]]>;
	custom?: boolean;
}

export function applyDatatypeOverrides(
	existing: Record<string, DatatypeDefinition>,
	raw: Record<string, RawDatatypeOverride>,
): Record<string, DatatypeDefinition> {
	const out = { ...existing };
	for (const [name, spec] of Object.entries(raw)) {
		out[name] = convertDatatypeOverride(name, spec);
	}
	return out;
}

function convertDatatypeOverride(name: string, spec: RawDatatypeOverride): DatatypeDefinition {
	const fields = (spec.fields || []).map((f) => {
		const parts = f.trim().split(/\s+/);
		const fieldName = parts.pop() || "value";
		const typeStr = parts.join(" ") || "auto";
		return { name: fieldName, type: parseClppTypeString(typeStr) };
	});
	const constructors: ConstructorDefinition[] = (spec.ctors || []).map((params, i) => ({
		owner: name,
		overloadIndex: i,
		parameters: params.map((p, idx) => parseParamString(p, idx)),
		tags: [],
	}));
	const staticMethods: MethodDefinition[] = (spec.staticMethods || []).map((m, i) => ({
		name: m[0],
		owner: name,
		overloadIndex: i,
		parameters: (m[2] || []).map((p, idx) => parseParamString(p, idx)),
		returnTypes: [parseClppTypeString(m[1])],
		canYield: false,
		tags: ["static"],
	}));
	const instanceMethods: MethodDefinition[] = (spec.methods || []).map((m, i) => ({
		name: m[0],
		owner: name,
		overloadIndex: i,
		parameters: (m[2] || []).map((p, idx) => parseParamString(p, idx)),
		returnTypes: [parseClppTypeString(m[1])],
		canYield: false,
		tags: [],
	}));
	return {
		name,
		summary: spec.summary,
		fields,
		constructors,
		staticProperties: spec.statics || [],
		staticMethods,
		instanceMethods,
		source: "override",
	};
}

function parseParamString(raw: string, index: number): ParameterDefinition {
	const parts = raw.trim().split(/\s+/);
	const name = parts.pop() || `arg${index}`;
	const typeStr = parts.join(" ") || "auto";
	const type = parseClppTypeString(typeStr);
	return { name, type, optional: type.kind === "Optional" };
}

export function applyGlobalsOverrides(
	existing: Record<string, GlobalDefinition>,
	raw: Record<string, { type?: string; layer?: GlobalDefinition["layer"]; description?: string }>,
): Record<string, GlobalDefinition> {
	const out = { ...existing };
	for (const [name, g] of Object.entries(raw)) {
		out[name] = {
			name,
			type: g.type ? parseClppTypeString(g.type) : { kind: "Any" },
			layer: g.layer || "roblox-engine",
			description: g.description,
		};
	}
	return out;
}

export function applyLibraryOverrides(
	existing: Record<string, LibraryDefinition>,
	raw: Record<string, LibraryDefinition>,
): Record<string, LibraryDefinition> {
	return { ...existing, ...raw };
}

export function applyClassOverrides(
	classes: RobloxTargetProfile["classes"],
	raw: Record<string, Partial<RobloxTargetProfile["classes"][string]>>,
): void {
	for (const [name, patch] of Object.entries(raw)) {
		if (!classes[name]) {
			continue;
		}
		Object.assign(classes[name], patch, { name });
	}
}

export { mapNamedTypeLike };
