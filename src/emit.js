"use strict";

const { isInstanceType, isMethod, isDatatype, luauType } = require("./api");
const { isLibraryType, isLibraryMethod, MODULE_COLON } = require("./libs");

function emit(ast, options = {}) {
	const strict = options.strict !== false;
	const lines = [];
	if (!options.skipHeader) {
		if (strict) {
			lines.push("--!strict");
		}
		lines.push("-- Compiled by Cluaupp — C++ × Luau");
		lines.push("");
	}

	const indentOf = (n) => "\t".repeat(n);

	const emitExpr = (node) => {
		if (!node) {
			return "nil";
		}
		switch (node.type) {
			case "null":
				return "nil";
			case "bool":
				return node.value ? "true" : "false";
			case "number":
				return node.value;
			case "string":
				return `"${node.value}"`;
			case "ident":
				return node.name;
			case "initlist": {
				const entries = (node.fields || []).map((field) => `${field.name} = ${emitExpr(field.value)}`);
				if (entries.length === 0) {
					return "{}";
				}
				return `{ ${entries.join(", ")} }`;
			}
			case "unary": {
				const inner = emitExpr(node.argument);
				if (node.op === "!") {
					return `not ${inner}`;
				}
				return `-${inner}`;
			}
			case "getService":
				return `game:GetService("${node.service}")`;
			case "new": {
				if (isLibraryType(node.className) || !isInstanceType(node.className)) {
					const args = node.args.map(emitExpr).join(", ");
					return `${node.className}.new(${args})`;
				}
				return `Instance.new("${node.className}")`;
			}
			case "member":
				return `${emitExpr(node.object)}.${node.name}`;
			case "call": {
				const args = node.args.map(emitExpr).join(", ");
				if (!node.object) {
					if (isDatatype(node.name)) {
						return `${node.name}.new(${args})`;
					}
					return `${node.name}(${args})`;
				}
				const obj = emitExpr(node.object);
				if (node.access === "::") {
					if (MODULE_COLON.has(node.name)) {
						return `${obj}:${node.name}(${args})`;
					}
					return `${obj}.${node.name}(${args})`;
				}
				if (isDatatype(obj) || (node.object.type === "ident" && isDatatype(node.object.name))) {
					return `${obj}.${node.name}(${args})`;
				}
				const colon = isMethod(node.name) || isLibraryMethod(node.name);
				return `${obj}${colon ? ":" : "."}${node.name}(${args})`;
			}
			case "assign":
				return `${emitExpr(node.left)} = ${emitExpr(node.right)}`;
			case "binary": {
				const ops = { "!=": "~=", "&&": "and", "||": "or" };
				const op = ops[node.op] || node.op;
				return `${emitExpr(node.left)} ${op} ${emitExpr(node.right)}`;
			}
			default:
				return "nil";
		}
	};

	const inferredType = (node) => {
		const created = node.value;
		if (created && created.type === "new" && (isInstanceType(created.className) || isLibraryType(created.className) || isDatatype(created.className))) {
			return created.className;
		}
		if (created && created.type === "call" && !created.object && isDatatype(created.name)) {
			return created.name;
		}
		if (created && created.type === "getService") {
			return created.service;
		}
		const fromCpp = luauType(node.valueType);
		if (fromCpp && fromCpp !== "auto") {
			return fromCpp;
		}
		return null;
	};

	const emitNewDecl = (node, indent) => {
		const prefix = indentOf(indent);
		const typeAnn = inferredType(node);
		const kind = node.isConst ? "const" : "local";
		const typed = typeAnn ? `: ${typeAnn}` : "";
		const created = node.value;
		if (created && created.type === "new" && isInstanceType(created.className) && !isLibraryType(created.className)) {
			const linesOut = [`${prefix}${kind} ${node.name}${typed} = Instance.new("${created.className}")`];
			if (created.args[0]) {
				linesOut.push(`${prefix}${node.name}.Parent = ${emitExpr(created.args[0])}`);
			}
			return linesOut;
		}
		if (created && created.type === "new" && (isDatatype(created.className) || isLibraryType(created.className))) {
			const args = created.args.map(emitExpr).join(", ");
			return [`${prefix}${kind} ${node.name}${typed} = ${created.className}.new(${args})`];
		}
		const value = node.value ? emitExpr(node.value) : "nil";
		return [`${prefix}${kind} ${node.name}${typed} = ${value}`];
	};

	const emitStmt = (node, indent) => {
		const prefix = indentOf(indent);
		switch (node.type) {
			case "decl":
				return emitNewDecl(node, indent);
			case "expr": {
				const expr = node.expr;
				if (
					expr &&
					expr.type === "assign" &&
					expr.right &&
					expr.right.type === "new" &&
					isInstanceType(expr.right.className) &&
					!isLibraryType(expr.right.className)
				) {
					const left = emitExpr(expr.left);
					const linesOut = [`${prefix}${left} = Instance.new("${expr.right.className}")`];
					if (expr.right.args[0]) {
						linesOut.push(`${prefix}${left}.Parent = ${emitExpr(expr.right.args[0])}`);
					}
					return linesOut;
				}
				return [`${prefix}${emitExpr(expr)}`];
			}
			case "return":
				return node.value ? [`${prefix}return ${emitExpr(node.value)}`] : [`${prefix}return`];
			case "if": {
				const out = [`${prefix}if ${emitExpr(node.test)} then`];
				for (const stmt of node.consequent) {
					out.push(...emitStmt(stmt, indent + 1));
				}
				if (node.alternate) {
					out.push(`${prefix}else`);
					for (const stmt of node.alternate) {
						out.push(...emitStmt(stmt, indent + 1));
					}
				}
				out.push(`${prefix}end`);
				return out;
			}
			case "while": {
				const out = [`${prefix}while ${emitExpr(node.test)} do`];
				for (const stmt of node.body) {
					out.push(...emitStmt(stmt, indent + 1));
				}
				out.push(`${prefix}end`);
				return out;
			}
			case "foreach": {
				const out = [`${prefix}for _, ${node.name} in ${emitExpr(node.iter)} do`];
				for (const stmt of node.body) {
					out.push(...emitStmt(stmt, indent + 1));
				}
				out.push(`${prefix}end`);
				return out;
			}
			default:
				return [];
		}
	};

	const paramList = (fn) =>
		fn.params
			.map((param) => {
				if (typeof param === "string") {
					return param;
				}
				const typeAnn = luauType(param.valueType);
				return typeAnn ? `${param.name}: ${typeAnn}` : param.name;
			})
			.join(", ");

	const returnAnn = (fn) => {
		const typeAnn = luauType(fn.returnType);
		if (!typeAnn || typeAnn === "()") {
			return "";
		}
		return `: ${typeAnn}`;
	};

	for (const decl of ast.body) {
		if (decl.type === "decl") {
			lines.push(...emitNewDecl(decl, 0));
			lines.push("");
			continue;
		}
		if (decl.type !== "function") {
			continue;
		}
		lines.push(`const function ${decl.name}(${paramList(decl)})${returnAnn(decl)}`);
		for (const stmt of decl.body) {
			lines.push(...emitStmt(stmt, 1));
		}
		lines.push("end");
		lines.push("");
	}

	const hasInit = ast.body.some((decl) => decl.type === "function" && decl.name === "init");
	if (hasInit && !options.skipInit) {
		lines.push("init()");
		lines.push("");
	}

	return lines.join("\n");
}

module.exports = { emit };
