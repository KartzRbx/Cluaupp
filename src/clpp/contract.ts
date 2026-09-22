/** Stable CL++ ↔ Cluaupp contract (CL++ 0.8.x). Cluaupp invokes the `clpp` binary. */

export interface CompileRequest {
	source: string;
	fileName: string;
	strict?: boolean;
	cwd?: string;
	/** false = skip high-level opts (fair baseline). Default true when omitted. */
	optimize?: boolean;
	/** Path to RobloxTargetProfile JSON (Cluaupp target — not embedded in CLPP). */
	targetProfilePath?: string;
	/** Directory holding cached target artifacts. */
	targetCacheDir?: string;
	/** Run context from file tags (.server / .client / .plugin). */
	runContext?: "Server" | "Client" | "Plugin" | "Shared";
	/** Path to capability-profile.json for Context Safety rules. */
	capabilityProfilePath?: string;
	/** Path to Typed DataModel profile JSON (Rojo graph). */
	datamodelProfilePath?: string;
}

export interface CompileDiagnostic {
	message: string;
	/** 1-based */
	line: number;
	/** 1-based */
	column: number;
	severity: string;
}

export interface ModuleRequireEntry {
	name: string;
	from_file?: string;
	to_file?: string;
	fromFile?: string;
	toFile?: string;
}

export interface CompileArtifact {
	ok: boolean;
	luau: string;
	fileName: string;
	outputHint: string;
	scriptKind: "server" | "client" | "plugin" | null;
	isScript: boolean;
	isHeader: boolean;
	rojoClass: "Script" | "LocalScript" | "ModuleScript";
	libraries: string[];
	error?: string;
	diagnostics?: CompileDiagnostic[];
	sourceMap?: Array<{ luauLine: number; clppLine: number; file: string }>;
	/** Named `import` / quoted include requires from CL++ (RFC 0003). */
	requires?: ModuleRequireEntry[];
	/** Selective @native candidates (RFC 0011). Not auto-applied as blanket. */
	nativeHints?: string[];
	/** Monomorphized generic symbols (`name__Type`). */
	specialized?: string[];
	/** Dense / SoA / buffer layout candidates. */
	layoutHints?: string[];
	/** False when compiled with --no-opt / optimize:false. */
	optimized?: boolean;
}

export interface LanguageManifest {
	name: "CL++";
	id: "clpp";
	version: string;
	extensions: string[];
	tags: Array<{
		pattern: string;
		scriptKind: string;
		rojoClass: string;
	}>;
	builtins: string[];
	operators: Array<{ clpp: string; luau: string; meaning: string }>;
	io: Array<{ clpp: string; luau: string }>;
}

export const MIN_CLPP_VERSION = "0.7.0";

export const CLPP_INSTALL_HINT =
	"Install CL++ 0.8.0 or newer when available (`clpp` from https://github.com/KartzRbx/CLPP/releases); host floor is 0.7.0. Put it on PATH. Prefer `import { Name } from \"./x.clh\"` for language modules. Override with CLPP or CLPP_PATH.";
