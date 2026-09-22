import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import { pkg } from "../package-info.js";
import { overridesHash, readOverrideFile } from "./loader.js";
import type {
	GlobalDefinition,
	LibraryDefinition,
	RobloxTargetProfile,
	SourceMeta,
} from "./model.js";
import { ROBLOX_TARGET_SCHEMA_VERSION } from "./model.js";
import { normalizeMiniDump } from "./normalize.js";
import { applyDatatypeOverrides, applyGlobalsOverrides, applyLibraryOverrides, applyClassOverrides } from "./merge.js";
import { deriveServices } from "./registry.js";
import { hashBuffer } from "./resolver.js";
import { loadMiniDump } from "./sources/mini-dump.js";
import { assertValid } from "./validate.js";

const DEFAULT_GLOBALS: Record<string, GlobalDefinition> = {
	game: { name: "game", type: { kind: "Class", name: "DataModel" }, layer: "roblox-engine" },
	workspace: { name: "workspace", type: { kind: "Class", name: "Workspace" }, layer: "roblox-engine" },
	script: { name: "script", type: { kind: "Class", name: "LuaSourceContainer" }, layer: "roblox-engine" },
	plugin: { name: "plugin", type: { kind: "Class", name: "Plugin" }, layer: "roblox-engine" },
	typeof: { name: "typeof", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "string" }] }, layer: "luau-core" },
	print: { name: "print", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "void" }], variadic: true }, layer: "luau-core" },
	warn: { name: "warn", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Primitive", name: "void" }], variadic: true }, layer: "luau-core" },
	error: { name: "error", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Never" }], variadic: true }, layer: "luau-core" },
	require: { name: "require", type: { kind: "Function", parameters: [{ kind: "Any" }], returns: [{ kind: "Any" }] }, layer: "luau-core" },
	task: { name: "task", type: { kind: "Any" }, layer: "roblox-engine", description: "Roblox task library" },
};

const DEFAULT_LIBRARIES: Record<string, LibraryDefinition> = {
	math: { name: "math", layer: "luau-core" },
	string: { name: "string", layer: "luau-core" },
	table: { name: "table", layer: "luau-core" },
	bit32: { name: "bit32", layer: "luau-core" },
	buffer: { name: "buffer", layer: "luau-core" },
	coroutine: { name: "coroutine", layer: "luau-core" },
	debug: { name: "debug", layer: "luau-core" },
	os: { name: "os", layer: "luau-core" },
	utf8: { name: "utf8", layer: "luau-core" },
	task: { name: "task", layer: "roblox-engine" },
	Hive: { name: "Hive", layer: "cluaupp-runtime", bind: "Hive" },
	Flare: { name: "Flare", layer: "cluaupp-runtime", bind: "Flare" },
	Roster: { name: "Roster", layer: "cluaupp-runtime", bind: "Roster" },
	Ward: { name: "Ward", layer: "cluaupp-runtime", bind: "Ward" },
	Axiom: { name: "Axiom", layer: "cluaupp-runtime", bind: "Axiom" },
};

export interface BuildProfileOptions {
	dumpPath?: string;
	skipValidate?: boolean;
}

export function buildRobloxTargetProfile(options: BuildProfileOptions = {}): RobloxTargetProfile {
	const loaded = loadMiniDump(options.dumpPath);
	const { classes, enums, unsupported } = normalizeMiniDump(loaded.data);

	const datatypeFile = readOverrideFile<{ datatypes?: Record<string, import("./merge.js").RawDatatypeOverride> }>(
		"datatypes.json",
	);
	const datatypes = applyDatatypeOverrides({}, datatypeFile.data.datatypes || {});

	const globalsFile = readOverrideFile<Record<string, { type?: string; layer?: GlobalDefinition["layer"]; description?: string }>>(
		"globals.json",
	);
	const globals = applyGlobalsOverrides(DEFAULT_GLOBALS, stripMeta(globalsFile.data));

	const libsFile = readOverrideFile<Record<string, LibraryDefinition>>("libraries.json");
	const libraries = applyLibraryOverrides(DEFAULT_LIBRARIES, stripMeta(libsFile.data) as Record<string, LibraryDefinition>);

	const classesFile = readOverrideFile<Record<string, Partial<(typeof classes)[string]>>>("classes.json");
	applyClassOverrides(classes, stripMeta(classesFile.data) as Record<string, Partial<(typeof classes)[string]>>);

	const services = deriveServices(classes);

	const sources: Record<string, SourceMeta> = {
		[loaded.meta.id]: loaded.meta,
		overrides: {
			id: "overrides",
			hash: overridesHash(),
			loadedAt: new Date().toISOString(),
			path: path.join(projectRoot, "api", "overrides"),
		},
	};

	const profile: RobloxTargetProfile = {
		target: "roblox",
		schemaVersion: ROBLOX_TARGET_SCHEMA_VERSION,
		robloxApiVersion: loaded.meta.version != null ? String(loaded.meta.version) : undefined,
		generatorVersion: pkg.version,
		sources,
		classes,
		enums,
		datatypes,
		globals,
		libraries,
		services,
		aliases: {},
		constructors: Object.fromEntries(
			Object.values(datatypes)
				.filter((d) => d.constructors.length)
				.map((d) => [d.name, d.constructors]),
		),
		security: {},
		deprecations: {},
		unsupported,
	};

	if (!options.skipValidate) {
		assertValid(profile);
	}
	return profile;
}

function stripMeta<T extends Record<string, unknown>>(data: T): T {
	const { _meta: _, ...rest } = data as T & { _meta?: unknown };
	return rest as T;
}

export function writeProfileCache(profile: RobloxTargetProfile, outPath?: string): string {
	const target = outPath || path.join(projectRoot, "api", "normalized", "roblox-target.profile.json");
	fs.mkdirSync(path.dirname(target), { recursive: true });
	const json = `${JSON.stringify(profile, null, "\t")}\n`;
	const tmp = `${target}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, json, "utf8");
	fs.renameSync(tmp, target);
	return target;
}

export function profileContentHash(profile: RobloxTargetProfile): string {
	const clone = { ...profile, sources: { ...profile.sources } };
	for (const key of Object.keys(clone.sources)) {
		clone.sources[key] = { ...clone.sources[key], loadedAt: "" };
	}
	return hashBuffer(JSON.stringify(clone));
}
