/** Stable CL++ ↔ Cluaupp contract. Cluaupp invokes the `clpp` binary. */

export interface CompileRequest {
	source: string;
	fileName: string;
	strict?: boolean;
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

export const CLPP_INSTALL_HINT =
	"Install CL++ and put `clpp` on PATH: https://github.com/KartzRbx/CLPP (`cargo install --path .` then `clpp install`). Override with CLPP_PATH.";
