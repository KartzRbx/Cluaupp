/** Stable CL++ ↔ Cluaupp contract (CL++ 0.7.x). Cluaupp invokes the `clpp` binary. */

export interface CompileRequest {
	source: string;
	fileName: string;
	strict?: boolean;
	cwd?: string;
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
	"Install CL++ 0.7.0 or newer (`clpp` from https://github.com/KartzRbx/CLPP/releases) and put it on PATH. Instances are class names (`Player player`, not `Player*`). Override with CLPP or CLPP_PATH.";
