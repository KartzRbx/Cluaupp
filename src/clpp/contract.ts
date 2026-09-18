/** Stable CL++ ↔ Cluaupp contract. Cluaupp invokes the `clpp` binary. */

export interface CompileRequest {
	source: string;
	fileName: string;
	strict?: boolean;
	cwd?: string;
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

export const MIN_CLPP_VERSION = "0.2.6";

export const CLPP_INSTALL_HINT =
	"Install CL++ 0.2.6+ and put `clpp` on PATH: https://github.com/KartzRbx/CLPP/releases (`clpp-setup.exe`, then `clpp install`). A stale cargo 0.1.0 on PATH will break for-in / GetService. Override with CLPP_PATH.";
