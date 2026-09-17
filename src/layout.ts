import type { AstNode } from "./ast.js";

export const SECTION = {
	api: "API",
	constants: "CONSTANTS",
	variables: "VARIABLES",
	types: "TYPES",
	support: "HELPERS FUNCTIONS",
	principal: "MAIN FUNCTIONS",
	cleanup: "JANITOR",
	returns: "RETURN",
};

export const CLEANUP_FN = /^(OnClose|OnPlayerRemoving|Cleanup|Shutdown|OnDestroy)$/i;
export const PRINCIPAL_FN = /^(init|start|main|setup)/i;
export const ENTRY_FN = /^(init|main)$/i;

function isGetService(node: AstNode | null | undefined): boolean {
	return Boolean(node && node.type === "getService");
}

function isDataServiceAlias(node: AstNode | null | undefined): boolean {
	let current: AstNode | undefined = node || undefined;
	while (current && current.type === "member") {
		if (current.object && current.object.type === "ident" && current.object.name === "DataService") {
			return true;
		}
		current = current.object;
	}
	return false;
}

export function isJanitorDecl(decl: AstNode | null | undefined): boolean {
	if (!decl || decl.type !== "decl") {
		return false;
	}
	const name = String(decl.name || "").toLowerCase();
	const typeName = String(decl.valueType || "").toLowerCase();
	const created = decl.value && decl.value.type === "new" && decl.value.className === "Janitor";
	return name.includes("janitor") || typeName.includes("janitor") || created;
}

export function isApiDecl(decl: AstNode | null | undefined): boolean {
	if (!decl || decl.type !== "decl") {
		return false;
	}
	return isGetService(decl.value) || isDataServiceAlias(decl.value);
}

export function classifyDecl(decl: AstNode | null | undefined): string | null {
	if (!decl || decl.type === "proto") {
		return null;
	}
	if (decl.type === "decl") {
		if (isApiDecl(decl)) {
			return "api";
		}
		if (isJanitorDecl(decl)) {
			return "variables";
		}
		if (decl.isConst) {
			return "constants";
		}
		return "variables";
	}
	if (decl.type === "function") {
		if (CLEANUP_FN.test(decl.name || "")) {
			return "cleanup";
		}
		if (PRINCIPAL_FN.test(decl.name || "")) {
			return "principal";
		}
		return "support";
	}
	return null;
}

export function organizeDecls(keep: AstNode[]): Record<string, AstNode[]> {
	const groups: Record<string, AstNode[]> = {
		api: [],
		constants: [],
		variables: [],
		support: [],
		principal: [],
		cleanup: [],
	};
	for (const decl of keep) {
		const bucket = classifyDecl(decl);
		if (bucket && groups[bucket]) {
			groups[bucket].push(decl);
		}
	}
	return groups;
}

export function janitorNames(keep: AstNode[] | null | undefined): string[] {
	return (keep || []).filter(isJanitorDecl).map((decl) => decl.name);
}

export function emitSection(_title: string, body: string): string {
	const text = String(body || "").trimEnd();
	if (!text) {
		return "";
	}
	return `${text}\n\n`;
}

export function joinBlocks(parts: Array<string | null | undefined>): string {
	return parts.filter((part) => Boolean(part && String(part).trim())).join("\n\n");
}

export function commentLine(title: string): string {
	return `-- ${title}`;
}
