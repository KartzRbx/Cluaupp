"use strict";

const SECTION = {
	api: "API",
	constants: "CONSTANTES",
	variables: "VARIAVEIS",
	types: "TIPAGENS",
	support: "FUNÇÕES DE SUPORTE",
	principal: "FUNÇÕES PRINCIPAIS",
	cleanup: "LIMPEZA",
	returns: "RETORNO",
};

const CLEANUP_FN = /^(OnClose|OnPlayerRemoving|Cleanup|Shutdown|OnDestroy)$/i;
const PRINCIPAL_FN = /^(init|start|main|setup)/i;
const ENTRY_FN = /^(init|main)$/i;

function isGetService(node) {
	return Boolean(node && node.type === "getService");
}

function isDataServiceAlias(node) {
	let current = node;
	while (current && current.type === "member") {
		if (current.object && current.object.type === "ident" && current.object.name === "DataService") {
			return true;
		}
		current = current.object;
	}
	return false;
}

function isJanitorDecl(decl) {
	if (!decl || decl.type !== "decl") {
		return false;
	}
	const name = String(decl.name || "").toLowerCase();
	const typeName = String(decl.valueType || "").toLowerCase();
	const created = decl.value && decl.value.type === "new" && decl.value.className === "Janitor";
	return name.includes("janitor") || typeName.includes("janitor") || created;
}

function isApiDecl(decl) {
	if (!decl || decl.type !== "decl") {
		return false;
	}
	return isGetService(decl.value) || isDataServiceAlias(decl.value);
}

function classifyDecl(decl) {
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

function organizeDecls(keep) {
	const groups = {
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

function janitorNames(keep) {
	return (keep || []).filter(isJanitorDecl).map((decl) => decl.name);
}

function emitSection(_title, body) {
	const text = String(body || "").trimEnd();
	if (!text) {
		return "";
	}
	return `${text}\n\n`;
}

function joinBlocks(parts) {
	return parts.filter((part) => Boolean(part && String(part).trim())).join("\n\n");
}

function commentLine(title) {
	return `-- ${title}`;
}

module.exports = {
	SECTION,
	CLEANUP_FN,
	PRINCIPAL_FN,
	ENTRY_FN,
	isJanitorDecl,
	isApiDecl,
	classifyDecl,
	organizeDecls,
	janitorNames,
	emitSection,
	joinBlocks,
	commentLine,
};
