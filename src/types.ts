export interface TranspilerState {
	robloxServices: Set<string>;
	moduleRequires: Map<string, string>;
	customTypes: string[];
	constants: string[];
	functions: string[];
	headerLines: string[];
	strict: boolean;
}

export interface RojoConfig {
	name?: string;
	tree?: Record<string, unknown>;
}

export interface RojoPathBinding {
	robloxPath: string;
	fsPath: string;
}

export interface RequireBinding {
	alias: string;
	path: string;
}

export interface CompileOptions {
	strict?: boolean;
	architecture?: boolean;
	/** Pass through to clpp (default true). */
	optimize?: boolean;
	rootDir?: string;
	outDir?: string;
	filePath?: string;
	relativeName?: string;
	outName?: string;
	srcDir?: string;
	includeDirs?: string[];
	moduleIncludes?: unknown[];
	skipInit?: boolean;
	skipHeader?: boolean;
	headerImplName?: string;
}

export interface ProjectConfig {
	rootDir: string;
	outDir: string;
	strict: boolean;
	architecture: boolean;
	rules?: {
		clientCannotImport?: string[];
		sharedCannotUse?: string[];
		serverCannotImport?: string[];
	};
	components?: Array<{ path: string; children: Record<string, string> }>;
}

export interface BuildOptions {
	exitOnError?: boolean;
	holdOnError?: boolean;
	syncVendor?: boolean;
	format?: boolean;
	analyze?: boolean;
	rojo?: string;
	strict?: boolean;
	/** Fail if api lock / Flare versions / component contracts are dirty. */
	frozen?: boolean;
	/** Skip transpile when source fingerprint matches `.cluaupp/compile-cache` (default true). */
	incremental?: boolean;
	/** Parallel transpile workers for async build (default: CPU-bounded). Set 1 to disable. */
	jobs?: number;
}

export interface BuildResult {
	failed: number;
	written: Set<string>;
}

export interface CompiledArtifact {
	name: string;
	contents: string;
}

export interface CompileServiceResult {
	kind?: string;
	plan?: unknown;
	files: CompiledArtifact[];
	stale?: string[];
}

export interface CollectorContext {
	fileName: string;
	sourcePath?: string;
	srcDir?: string;
	outDir?: string;
	strict?: boolean;
}
