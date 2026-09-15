"use strict";

const KEYWORDS = new Set([
	"if",
	"else",
	"for",
	"while",
	"return",
	"new",
	"auto",
	"const",
	"void",
	"int",
	"bool",
	"float",
	"double",
	"true",
	"false",
	"nullptr",
	"class",
	"struct",
	"public",
	"private",
	"protected",
	"namespace",
	"using",
	"template",
	"typedef",
	"extern",
	"enum",
]);

function tokenize(source) {
	const tokens = [];
	let i = 0;
	let line = 1;
	let col = 1;

	const push = (type, value, startLine, startCol) => {
		tokens.push({ type, value, line: startLine, col: startCol });
	};

	while (i < source.length) {
		const c = source[i];

		if (c === "\n") {
			i += 1;
			line += 1;
			col = 1;
			continue;
		}
		if (c === " " || c === "\t" || c === "\r") {
			i += 1;
			col += 1;
			continue;
		}
		if (c === "#") {
			while (i < source.length && source[i] !== "\n") {
				i += 1;
			}
			continue;
		}
		if (c === "/" && source[i + 1] === "/") {
			while (i < source.length && source[i] !== "\n") {
				i += 1;
			}
			continue;
		}
		if (c === "/" && source[i + 1] === "*") {
			i += 2;
			col += 2;
			while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
				if (source[i] === "\n") {
					line += 1;
					col = 1;
				} else {
					col += 1;
				}
				i += 1;
			}
			i += 2;
			col += 2;
			continue;
		}

		const startLine = line;
		const startCol = col;

		if (c === '"') {
			i += 1;
			col += 1;
			let value = "";
			while (i < source.length && source[i] !== '"') {
				if (source[i] === "\\" && i + 1 < source.length) {
					value += source[i] + source[i + 1];
					i += 2;
					col += 2;
					continue;
				}
				value += source[i];
				i += 1;
				col += 1;
			}
			i += 1;
			col += 1;
			push("string", value, startLine, startCol);
			continue;
		}

		if (/[0-9]/.test(c)) {
			let value = "";
			while (i < source.length && /[0-9.]/.test(source[i])) {
				value += source[i];
				i += 1;
				col += 1;
			}
			push("number", value, startLine, startCol);
			continue;
		}

		if (/[A-Za-z_]/.test(c)) {
			let value = "";
			while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) {
				value += source[i];
				i += 1;
				col += 1;
			}
			push(KEYWORDS.has(value) ? "kw" : "ident", value, startLine, startCol);
			continue;
		}

		const two = source.slice(i, i + 2);
		if (["->", "==", "!=", "<=", ">=", "&&", "||", "::"].includes(two)) {
			push("op", two, startLine, startCol);
			i += 2;
			col += 2;
			continue;
		}

		push("op", c, startLine, startCol);
		i += 1;
		col += 1;
	}

	push("eof", "", line, col);
	return tokens;
}

module.exports = { tokenize };
