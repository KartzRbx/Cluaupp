import type { CompileOptions } from "./types.js";

export type Token = {
	type: string;
	value: string;
	line: number;
	col: number;
	start: number;
	end: number;
};

export type AstNode = {
	type: string;
	[key: string]: any;
};

export type AstProgram = {
	type: string;
	body: AstNode[];
	fileName: string;
};

export type ModuleInclude = {
	name: string;
	outRel: string;
	header?: string;
	impl?: string | null;
	exports?: { consts?: string[]; structs?: string[]; hasProtos?: boolean };
};

export type PreprocessOptions = CompileOptions & {
	pragmaResolved?: boolean;
	seen?: Set<string>;
	moduleIncludes?: ModuleInclude[];
	siblingHeader?: string | null;
	source?: string;
};
