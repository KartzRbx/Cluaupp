import path from "node:path";
import { projectRoot } from "../../package-info.js";
import { loadJsonFile, type LoadedSource } from "../loader.js";

export interface MiniDumpParameter {
	Name?: string;
	Type?: { Category?: string; Name?: string; Optional?: boolean };
	Default?: string;
}

export interface MiniDumpMember {
	MemberType: string;
	Name: string;
	ValueType?: { Category?: string; Name?: string; Optional?: boolean };
	ReturnType?: { Category?: string; Name?: string; Optional?: boolean };
	Parameters?: MiniDumpParameter[];
	Tags?: Array<string | Record<string, unknown>>;
	Security?: string | { Read?: string; Write?: string };
	ThreadSafety?: string;
	Default?: string;
	Category?: string;
}

export interface MiniDumpClass {
	Name: string;
	Superclass?: string;
	Tags?: Array<string | Record<string, unknown>>;
	Members?: MiniDumpMember[];
	MemoryCategory?: string;
}

export interface MiniDumpEnum {
	Name: string;
	Items?: Array<{ Name: string; Value: number }>;
}

export interface MiniApiDump {
	Classes: MiniDumpClass[];
	Enums: MiniDumpEnum[];
	Version?: number | string;
}

export function loadMiniDump(filePath?: string): LoadedSource<MiniApiDump> {
	const target = filePath || path.join(projectRoot, "data", "Mini-API-Dump.json");
	const loaded = loadJsonFile<MiniApiDump>("mini-api-dump", target);
	if (!Array.isArray(loaded.data.Classes) || !Array.isArray(loaded.data.Enums)) {
		throw new Error("Mini-API-Dump.json missing Classes/Enums arrays");
	}
	return loaded;
}
