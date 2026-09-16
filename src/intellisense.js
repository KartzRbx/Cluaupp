"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { tokenize } = require("./lex");
const { INSTANCE_TYPES, SERVICES } = require("./api");

const PACKAGE_ROOT = path.join(__dirname, "..");
const pkg = require("../package.json");

const KEYWORDS = [
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
	"struct",
	"class",
	"switch",
	"case",
	"default",
	"break",
	"template",
	"namespace",
	"public",
	"private",
];

const GLOBALS = [
	{ name: "game", type: "DataModel", kind: "variable", detail: "DataModel* game" },
	{ name: "workspace", type: "Workspace", kind: "variable", detail: "Workspace* workspace" },
	{ name: "script", type: "LuaSourceContainer", kind: "variable", detail: "LuaSourceContainer* script" },
	{ name: "print", type: "void", kind: "function", detail: "void print(string message)" },
	{ name: "warn", type: "void", kind: "function", detail: "void warn(string message)" },
	{ name: "error", type: "void", kind: "function", detail: "void error(string message)" },
	{ name: "GetService", type: "Instance", kind: "function", detail: "T* GetService<T>()" },
	{ name: "cout", type: "cout", kind: "variable", detail: "cout" },
	{ name: "cerr", type: "cerr", kind: "variable", detail: "cerr" },
	{ name: "endl", type: "int", kind: "variable", detail: "const int endl" },
	{ name: "tick", type: "double", kind: "function", detail: "double tick()" },
	{ name: "time", type: "double", kind: "function", detail: "double time()" },
	{ name: "wait", type: "void", kind: "function", detail: "void wait(double seconds = 0)" },
	{ name: "spawn", type: "void", kind: "function", detail: "void spawn(void (*callback)())" },
	{ name: "delay", type: "void", kind: "function", detail: "void delay(double seconds, void (*callback)())" },
];

const catalogCache = new Map();

function posix(file) {
	return String(file).replace(/\\/g, "/");
}

function collectFiles(dir, files = []) {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectFiles(full, files);
		} else {
			files.push(full);
		}
	}
	return files;
}

function isCppFile(file) {
	return /\.(cpp|cc|cxx|c|h|hpp|hh)$/i.test(file);
}

function cleanTypeName(name) {
	if (!name) {
		return "auto";
	}
	return String(name)
		.replace(/^::/, "")
		.replace(/\s+/g, "")
		.replace(/\*+$/, "")
		.replace(/&+$/, "")
		.replace(/^const/, "");
}

function ensureType(types, name, base) {
	const key = cleanTypeName(name);
	if (!key) {
		return null;
	}
	let entry = types.get(key);
	if (!entry) {
		entry = { name: key, base: base || null, members: new Map(), nested: new Map() };
		types.set(key, entry);
	} else if (base && !entry.base) {
		entry.base = base;
	}
	return entry;
}

function addMember(typeEntry, member) {
	if (!typeEntry || !member || !member.name) {
		return;
	}
	const existing = typeEntry.members.get(member.name);
	if (!existing || (member.kind === "method" && existing.kind !== "method")) {
		typeEntry.members.set(member.name, member);
	}
}

function tokenAt(tokens, i) {
	return tokens[i] || tokens[tokens.length - 1];
}

function indexCpp(source, types, globals, options = {}) {
	const tokens = tokenize(source);
	let i = 0;
	const ownerStack = [];
	const namespaceStack = [];
	const templateFields = options.templateFields || [];

	const peek = (offset = 0) => tokenAt(tokens, i + offset);
	const at = (type, value) => {
		const token = peek();
		if (type && token.type !== type) {
			return false;
		}
		if (value !== undefined && token.value !== value) {
			return false;
		}
		return true;
	};
	const eat = () => {
		const token = peek();
		i += 1;
		return token;
	};

	const skipBalanced = (open, close) => {
		if (!at("op", open)) {
			return;
		}
		let depth = 0;
		while (!at("eof")) {
			if (at("op", open)) {
				depth += 1;
			} else if (close === ">" && at("op", ">>")) {
				depth -= 2;
				eat();
				if (depth <= 0) {
					return;
				}
				continue;
			} else if (at("op", close)) {
				depth -= 1;
				eat();
				if (depth === 0) {
					return;
				}
				continue;
			}
			eat();
		}
	};

	const skipAngle = () => skipBalanced("<", ">");
	const skipParen = () => skipBalanced("(", ")");
	const skipBrace = () => skipBalanced("{", "}");

	const parseType = () => {
		while (at("kw", "const") || at("kw", "static") || at("ident", "unsigned") || at("ident", "signed") || at("ident", "long") || at("ident", "short")) {
			eat();
		}
		if (at("op", "::")) {
			eat();
		}
		let name = "auto";
		if (at("kw", "void") || at("kw", "int") || at("kw", "bool") || at("kw", "float") || at("kw", "double") || at("kw", "auto")) {
			name = eat().value;
		} else if (at("ident")) {
			name = eat().value;
		} else {
			return { name: "auto", element: null };
		}
		while (at("op", "::")) {
			eat();
			if (at("ident") || at("kw")) {
				name = eat().value;
			}
		}
		let element = null;
		if (at("op", "<")) {
			eat();
			const inner = parseType();
			element = inner.name;
			while (!at("eof") && !at("op", ">") && !at("op", ">>")) {
				eat();
			}
			if (at("op", ">>")) {
				eat();
			} else if (at("op", ">")) {
				eat();
			}
		}
		while (at("op", "*") || at("op", "&")) {
			eat();
		}
		return { name: cleanTypeName(name), element: element ? cleanTypeName(element) : null };
	};

	const parseParams = () => {
		const params = [];
		if (!at("op", "(")) {
			return params;
		}
		eat();
		while (!at("eof") && !at("op", ")")) {
			if (at("op", ",")) {
				eat();
				continue;
			}
			const saved = i;
			const type = parseType();
			let name = "";
			if (at("ident")) {
				name = eat().value;
			}
			if (at("op", "=")) {
				while (!at("eof") && !at("op", ",") && !at("op", ")")) {
					if (at("op", "(")) {
						skipParen();
					} else {
						eat();
					}
				}
			}
			if (type.name && type.name !== "auto") {
				params.push({ name, type: type.name });
			} else if (saved === i) {
				eat();
			}
		}
		if (at("op", ")")) {
			eat();
		}
		return params;
	};

	const currentType = () => (ownerStack.length ? ownerStack[ownerStack.length - 1] : null);

	const addGlobal = (item) => {
		if (!item || !item.name) {
			return;
		}
		globals.set(item.name, item);
	};

	while (!at("eof")) {
		if (at("kw", "using") || at("kw", "typedef") || at("kw", "extern") || at("kw", "template") || at("kw", "enum")) {
			if (at("kw", "enum")) {
				eat();
				if (at("kw", "class") || at("kw", "struct")) {
					eat();
				}
				const enumName = at("ident") ? eat().value : null;
				if (enumName) {
					ensureType(types, enumName);
					const parent = currentType();
					if (parent) {
						parent.nested.set(enumName, enumName);
					}
				}
				if (at("op", "{")) {
					eat();
					let enumType = enumName ? ensureType(types, `Enum${enumName}`) : null;
					if (enumName) {
						const enumNs = ensureType(types, "Enum");
						addMember(enumNs, { name: enumName, kind: "enum", type: enumName, detail: `Enum::${enumName}`, static: true });
						enumType = ensureType(types, enumName);
					}
					while (!at("eof") && !at("op", "}")) {
						if (at("ident")) {
							const item = eat().value;
							if (enumType) {
								addMember(enumType, { name: item, kind: "enum", type: enumName, detail: `${enumName}::${item}`, static: true });
							}
							while (!at("eof") && !at("op", ",") && !at("op", "}")) {
								eat();
							}
							if (at("op", ",")) {
								eat();
							}
							continue;
						}
						eat();
					}
					if (at("op", "}")) {
						eat();
					}
				}
				while (!at("eof") && !at("op", ";") && !at("kw", "struct") && !at("kw", "class") && !at("kw", "namespace")) {
					if (at("op", "{")) {
						skipBrace();
						break;
					}
					eat();
				}
				if (at("op", ";")) {
					eat();
				}
				continue;
			}
			if (at("kw", "template")) {
				eat();
				skipAngle();
				continue;
			}
			if (at("kw", "extern")) {
				eat();
				const type = parseType();
				if (at("ident")) {
					const name = eat().value;
					addGlobal({ name, type: type.name, kind: "variable", detail: `${type.name}* ${name}` });
				}
				while (!at("eof") && !at("op", ";")) {
					eat();
				}
				if (at("op", ";")) {
					eat();
				}
				continue;
			}
			while (!at("eof") && !at("op", ";") && !at("op", "{")) {
				eat();
			}
			if (at("op", "{")) {
				skipBrace();
			} else if (at("op", ";")) {
				eat();
			}
			continue;
		}

		if (at("kw", "namespace")) {
			eat();
			const name = at("ident") ? eat().value : "_anon";
			const typeEntry = ensureType(types, name);
			if (at("op", "{")) {
				eat();
				ownerStack.push(typeEntry);
				namespaceStack.push(name);
				continue;
			}
			continue;
		}

		if (at("kw", "struct") || at("kw", "class")) {
			eat();
			const name = at("ident") ? eat().value : "_anon";
			let base = null;
			if (at("op", ":")) {
				eat();
				while (at("kw", "public") || at("kw", "private") || at("kw", "protected")) {
					eat();
				}
				if (at("op", "::")) {
					eat();
				}
				if (at("ident")) {
					base = eat().value;
				}
			}
			const typeEntry = ensureType(types, name, base);
			if (at("op", ";")) {
				eat();
				continue;
			}
			if (at("op", "{")) {
				eat();
				ownerStack.push(typeEntry);
				continue;
			}
			continue;
		}

		if (at("kw", "public") || at("kw", "private") || at("kw", "protected")) {
			eat();
			if (at("op", ":")) {
				eat();
			}
			continue;
		}

		if (at("op", "}")) {
			eat();
			const finished = ownerStack.pop();
			namespaceStack.pop();
			if (at("ident") && finished) {
				const instanceName = eat().value;
				const parent = currentType();
				if (parent) {
					addMember(parent, {
						name: instanceName,
						kind: "property",
						type: finished.name,
						detail: `${finished.name} ${instanceName}`,
						nested: true,
					});
					parent.nested.set(instanceName, finished.name);
				}
				templateFields.push({ owner: parent ? parent.name : null, name: instanceName, type: finished.name, nested: true });
			}
			if (at("op", ";")) {
				eat();
			}
			continue;
		}

		if (at("op", ";")) {
			eat();
			continue;
		}

		const saved = i;
		const isStatic = at("kw", "static") || (peek().type === "ident" && peek().value === "static");
		if (at("kw", "static") || at("ident", "static")) {
			eat();
		}
		if (at("ident", "operator") || (at("ident") && peek().value === "operator")) {
			eat();
			const op = at("op") ? eat().value : "";
			const owner = currentType();
			parseParams();
			if (at("op", "{")) {
				skipBrace();
			} else if (at("op", ";")) {
				eat();
			}
			if (owner) {
				addMember(owner, {
					name: `operator${op}`,
					kind: "method",
					type: owner.name,
					detail: `${owner.name}& operator${op}`,
					static: Boolean(isStatic),
				});
			}
			continue;
		}

		const type = parseType();
		if (at("ident") && peek(1).value === "(") {
			const name = eat().value;
			const params = parseParams();
			const owner = currentType();
			const signature = `${type.name} ${name}(${params.map((param) => param.type + (param.name ? " " + param.name : "")).join(", ")})`;
			const member = {
				name,
				kind: name === (owner && owner.name) ? "constructor" : "method",
				type: type.name,
				element: type.element,
				params,
				detail: signature,
				static: Boolean(isStatic) || Boolean(namespaceStack.length && owner && owner.name === namespaceStack[namespaceStack.length - 1]),
			};
			if (owner) {
				addMember(owner, member);
			} else {
				addGlobal({ name, type: type.name, kind: "function", detail: signature, params });
			}
			if (at("op", "{")) {
				skipBrace();
			} else if (at("op", ";")) {
				eat();
			}
			continue;
		}

		if (at("ident") && peek(1).value === "::" && peek(3) && peek(3).value === "(") {
			const ownerName = eat().value;
			eat();
			const name = at("ident") ? eat().value : "";
			const params = parseParams();
			ensureType(types, ownerName);
			const owner = types.get(cleanTypeName(ownerName));
			addMember(owner, {
				name,
				kind: "method",
				type: type.name,
				element: type.element,
				params,
				detail: `${type.name} ${ownerName}::${name}()`,
			});
			if (at("op", "{")) {
				skipBrace();
			}
			continue;
		}

		if (at("ident")) {
			const name = eat().value;
			if (at("op", "=")) {
				while (!at("eof") && !at("op", ";")) {
					eat();
				}
			}
			const owner = currentType();
			const member = {
				name,
				kind: type.name === "RBXScriptSignal" ? "event" : "property",
				type: type.name,
				element: type.element,
				detail: `${type.name} ${name}`,
				static: Boolean(isStatic),
			};
			if (owner) {
				addMember(owner, member);
			} else {
				addGlobal({ name, type: type.name, kind: "variable", detail: member.detail });
			}
			if (at("op", ";")) {
				eat();
			}
			continue;
		}

		if (i === saved) {
			eat();
		}
	}

	return { types, globals };
}

function headerFiles(includeDir) {
	const root = path.join(includeDir, "cluaupp");
	if (!fs.existsSync(root)) {
		return [];
	}
	return collectFiles(root).filter((file) => isCppFile(file));
}

function catalogKey(projectRoot) {
	const includeDir = path.join(projectRoot, "include");
	const fallback = path.join(PACKAGE_ROOT, "include");
	const dir = fs.existsSync(includeDir) ? includeDir : fallback;
	let stamp = dir;
	for (const file of headerFiles(dir).slice(0, 8)) {
		try {
			stamp += ":" + fs.statSync(file).mtimeMs;
		} catch {
			// ignore
		}
	}
	return dir + stamp;
}

function loadCatalog(projectRoot) {
	const includeDir = fs.existsSync(path.join(projectRoot, "include", "cluaupp"))
		? path.join(projectRoot, "include")
		: path.join(PACKAGE_ROOT, "include");
	const key = catalogKey(projectRoot);
	const cached = catalogCache.get(key);
	if (cached) {
		return cached;
	}

	const types = new Map();
	const globals = new Map();
	for (const item of GLOBALS) {
		globals.set(item.name, item);
	}

	for (const file of headerFiles(includeDir)) {
		try {
			indexCpp(fs.readFileSync(file, "utf8"), types, globals);
		} catch {
			// Header stubs must not kill IntelliSense.
		}
	}

	for (const name of INSTANCE_TYPES) {
		ensureType(types, name, name === "Instance" ? "Object" : types.has(name) ? types.get(name).base : "Instance");
	}
	for (const name of SERVICES) {
		ensureType(types, name, types.has(name) ? types.get(name).base : "Instance");
	}

	const catalog = { types, globals, includeDir };
	catalogCache.set(key, catalog);
	return catalog;
}

function indexProject(projectRoot) {
	const catalog = loadCatalog(projectRoot);
	const types = new Map(catalog.types);
	const globals = new Map(catalog.globals);
	const structs = [];
	const srcDir = path.join(projectRoot, "src");
	if (fs.existsSync(srcDir)) {
		for (const file of collectFiles(srcDir).filter((entry) => isCppFile(entry))) {
			try {
				indexCpp(fs.readFileSync(file, "utf8"), types, globals);
			} catch {
				// Incomplete buffers are indexed best-effort.
			}
		}
	}
	for (const [name, type] of types) {
		if (!catalog.types.has(name) || type.nested.size) {
			structs.push(type);
		}
	}
	const template = types.get("TemplateData") || null;
	return { types, globals, template, includeDir: catalog.includeDir, srcDir };
}

function membersOf(index, typeName, seen = new Set()) {
	const name = cleanTypeName(typeName);
	if (!name || seen.has(name)) {
		return [];
	}
	seen.add(name);
	const type = index.types.get(name);
	if (!type) {
		return [];
	}
	const list = [...type.members.values()];
	if (type.base) {
		list.push(...membersOf(index, type.base, seen));
	}
	return list;
}

function pathMembers(index, nodeName) {
	const type = index.types.get(cleanTypeName(nodeName || "TemplateData"));
	if (!type) {
		return [];
	}
	return [...type.members.values()].filter((member) => member.kind === "property");
}

function lineAtOffset(source, offset) {
	const start = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
	return { start, text: source.slice(start, offset) };
}

function tokenIndexAt(tokens, offset) {
	let found = 0;
	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		if (typeof token.start !== "number") {
			continue;
		}
		if (token.start <= offset && offset <= token.end) {
			found = i;
		}
		if (token.start > offset) {
			break;
		}
		found = i;
	}
	return found;
}

function skipCallBack(tokens, i) {
	let index = i;
	while (index >= 0 && tokens[index] && tokens[index].value === ")") {
		let depth = 0;
		while (index >= 0) {
			const token = tokens[index];
			if (token.value === ")") {
				depth += 1;
			} else if (token.value === "(") {
				depth -= 1;
				if (depth === 0) {
					index -= 1;
					break;
				}
			}
			index -= 1;
		}
	}
	if (index >= 0 && tokens[index] && tokens[index].value === ">") {
		let depth = 0;
		while (index >= 0) {
			const token = tokens[index];
			if (token.value === ">") {
				depth += 1;
			} else if (token.value === "<") {
				depth -= 1;
				if (depth === 0) {
					index -= 1;
					break;
				}
			}
			index -= 1;
		}
	}
	return index;
}

function chainBefore(tokens, opIndex) {
	const chain = [];
	let i = opIndex;
	while (i >= 0) {
		const token = tokens[i];
		if (!token || token.type === "eof") {
			break;
		}
		if (token.value === "." || token.value === "->" || token.value === "::") {
			i -= 1;
			continue;
		}
		i = skipCallBack(tokens, i);
		const current = tokens[i];
		if (!current || (current.type !== "ident" && current.type !== "kw")) {
			break;
		}
		chain.unshift(current.value);
		i -= 1;
		const access = tokens[i];
		if (!access || (access.value !== "." && access.value !== "->" && access.value !== "::")) {
			break;
		}
		i -= 1;
	}
	return chain;
}

function enclosingOwner(tokens, index) {
	for (let i = index; i >= 1; i -= 1) {
		if (tokens[i] && tokens[i].value === "::" && tokens[i - 1] && tokens[i - 1].type === "ident") {
			const next = tokens[i + 1];
			if (next && next.type === "ident") {
				let j = i + 2;
				while (tokens[j] && tokens[j].value !== "{" && tokens[j].value !== ";") {
					if (tokens[j].value === "(") {
						return tokens[i - 1].value;
					}
					j += 1;
				}
			}
		}
		if (tokens[i] && (tokens[i].value === "struct" || tokens[i].value === "class") && tokens[i + 1] && tokens[i + 1].type === "ident") {
			return tokens[i + 1].value;
		}
	}
	return null;
}

function inferRhsType(tokens, start) {
	for (let i = start; i < tokens.length && tokens[i] && tokens[i].value !== ";"; i += 1) {
		if (tokens[i].value === "GetService" && tokens[i + 1] && tokens[i + 1].value === "<" && tokens[i + 2] && tokens[i + 2].type === "ident") {
			return tokens[i + 2].value;
		}
		if (tokens[i].value === "new" && tokens[i + 1] && tokens[i + 1].type === "ident") {
			return tokens[i + 1].value;
		}
	}
	return null;
}

function localsBefore(tokens, index) {
	const locals = new Map();
	for (let i = 0; i < index; i += 1) {
		const typeTok = tokens[i];
		if (!typeTok) {
			continue;
		}
		const isType = typeTok.type === "ident" || ["int", "bool", "float", "double", "auto", "void"].includes(typeTok.value);
		if (!isType) {
			continue;
		}
		if (typeTok.value === "struct" || typeTok.value === "class" || typeTok.value === "namespace") {
			continue;
		}
		let cursor = i + 1;
		while (tokens[cursor] && (tokens[cursor].value === "*" || tokens[cursor].value === "&")) {
			cursor += 1;
		}
		const ident = tokens[cursor];
		if (!ident || ident.type !== "ident") {
			continue;
		}
		if (tokens[cursor + 1] && tokens[cursor + 1].value === "(" && typeTok.value !== "auto") {
			continue;
		}
		let typeName = cleanTypeName(typeTok.value);
		if (typeName === "auto") {
			typeName = inferRhsType(tokens, cursor) || typeName;
		}
		locals.set(ident.value, { name: ident.value, type: typeName, kind: "variable" });
	}
	return locals;
}

function inferGetService(tokens, index) {
	for (let i = index; i >= 2; i -= 1) {
		if (tokens[i].value === ">" && tokens[i - 2] && tokens[i - 2].value === "GetService") {
			const inner = tokens[i - 1];
			if (inner && inner.type === "ident") {
				return inner.value;
			}
		}
	}
	return null;
}

function lookupMember(index, typeName, name) {
	return membersOf(index, typeName).find((member) => member.name === name) || null;
}

function inferChain(index, chain, owner, locals) {
	if (!chain.length) {
		return null;
	}
	let current = null;
	let pathNode = null;
	const first = chain[0];
	if (first === "this" && owner) {
		current = owner;
	} else if (index.types.has(first) && (chain.length === 1 || true)) {
		const local = locals.get(first);
		if (local) {
			current = local.type;
		} else if (index.globals.has(first)) {
			current = index.globals.get(first).type;
		} else if (owner) {
			const field = lookupMember(index, owner, first);
			current = field ? field.type : first;
		} else {
			current = first;
		}
	} else if (locals.has(first)) {
		current = locals.get(first).type;
	} else if (index.globals.has(first)) {
		current = index.globals.get(first).type;
	} else if (owner) {
		const field = lookupMember(index, owner, first);
		current = field ? field.type : null;
	}
	if (!current) {
		return null;
	}
	if (current === "DataPath" && index.template) {
		pathNode = "TemplateData";
	}
	if (first === "DataService") {
		current = "DataService";
	}

	for (let i = 1; i < chain.length; i += 1) {
		const name = chain[i];
		if (current === "DataPath" || pathNode) {
			const props = pathMembers(index, pathNode || "TemplateData");
			const prop = props.find((item) => item.name === name);
			if (prop) {
				const nested = pathMembers(index, prop.type);
				if (nested.length && !["int", "string", "bool", "double", "float"].includes(prop.type)) {
					current = "DataPath";
					pathNode = prop.type;
				} else {
					current = prop.type;
					pathNode = null;
				}
				continue;
			}
		}
		const member = lookupMember(index, current, name);
		if (!member) {
			if (name === "Paths") {
				current = "DataPath";
				pathNode = "TemplateData";
				continue;
			}
			return { type: current, pathNode };
		}
		if (member.element && member.type === "LuaArray") {
			current = "LuaArray";
		} else {
			current = member.type;
		}
		if (current === "DataPath") {
			pathNode = pathNode || "TemplateData";
		}
	}
	return { type: current, pathNode, element: index.types.get(current) ? null : null };
}

function filterPrefix(items, prefix) {
	if (!prefix) {
		return items;
	}
	const lower = prefix.toLowerCase();
	return items.filter((item) => item.name.toLowerCase().startsWith(lower));
}

function uniqueItems(items) {
	const seen = new Set();
	const out = [];
	for (const item of items) {
		const key = item.kind + ":" + item.name;
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		out.push(item);
	}
	return out;
}

function includeCompletions(source, offset, index) {
	const { text } = lineAtOffset(source, offset);
	const match = text.match(/^\s*#\s*include\s+(["<])([^">]*)$/);
	if (!match) {
		return null;
	}
	const quote = match[1];
	const prefix = match[2] || "";
	const items = [];
	if (quote === "<") {
		const root = path.join(index.includeDir, "cluaupp");
		if (fs.existsSync(root)) {
			for (const file of collectFiles(root)) {
				const rel = "cluaupp/" + posix(path.relative(root, file));
				items.push({ name: rel, kind: "file", type: "header", detail: `#include <${rel}>` });
			}
		}
		items.push({ name: "cluaupp/roblox.hpp", kind: "file", type: "header", detail: "#include <cluaupp/roblox.hpp>" });
	} else if (index.srcDir && fs.existsSync(index.srcDir)) {
		for (const file of collectFiles(index.srcDir).filter((entry) => isCppFile(entry))) {
			const rel = posix(path.relative(index.srcDir, file));
			items.push({ name: rel, kind: "file", type: "header", detail: `#include "${rel}"` });
		}
	}
	return filterPrefix(items, prefix.split("/").pop() || prefix);
}

function completeAt(source, offset, options = {}) {
	const projectRoot = options.projectRoot || process.cwd();
	const index = indexProject(projectRoot);
	const includeItems = includeCompletions(source, offset, index);
	if (includeItems) {
		return uniqueItems(includeItems);
	}

	const tokens = tokenize(source);
	const indexTok = tokenIndexAt(tokens, offset);
	const current = tokens[indexTok];
	let prefix = "";
	let opIndex = indexTok;
	if (current && current.type === "ident" && current.start < offset) {
		prefix = source.slice(current.start, offset);
		opIndex = indexTok - 1;
	} else if (current && (current.value === "." || current.value === "->" || current.value === "::" || current.value === "<")) {
		prefix = "";
		opIndex = indexTok;
	}

	const owner = enclosingOwner(tokens, indexTok);
	const locals = localsBefore(tokens, indexTok);
	if (owner) {
		for (const member of membersOf(index, owner)) {
			if (member.kind === "property") {
				locals.set(member.name, { name: member.name, type: member.type, kind: "property" });
			}
		}
	}

	const op = tokens[opIndex];
	if (op && op.value === "<") {
		const ident = tokens[opIndex - 1];
		if (ident && ident.value === "GetService") {
			return uniqueItems(
				filterPrefix(
					[...SERVICES].map((name) => ({ name, kind: "class", type: name, detail: `GetService<${name}>()` })),
					prefix,
				),
			);
		}
	}

	if (op && (op.value === "." || op.value === "->" || op.value === "::")) {
		const chain = chainBefore(tokens, opIndex - 1);
		if (op.value === "::" && chain.length === 1 && index.types.has(chain[0])) {
			const type = index.types.get(chain[0]);
			const statics = [...type.members.values()].filter((member) => member.static || member.kind === "enum" || member.kind === "constructor");
			const nested = [...type.nested.keys()].map((name) => ({ name, kind: "class", type: name, detail: `${chain[0]}::${name}` }));
			if (chain[0] === "Enum") {
				return uniqueItems(filterPrefix([...type.members.values(), ...nested], prefix));
			}
			if (chain[0] === "DataService") {
				return uniqueItems(
					filterPrefix(
						[
							{ name: "Server", kind: "property", type: "DataServiceServer", detail: "DataServiceServer Server", static: true },
							{ name: "Client", kind: "property", type: "DataServiceClient", detail: "DataServiceClient Client", static: true },
							{ name: "Paths", kind: "property", type: "DataPath", detail: "DataPath Paths", static: true },
							{ name: "Enum", kind: "property", type: "DataServiceEnum", detail: "DataServiceEnum Enum", static: true },
							...statics,
							...nested,
						],
						prefix,
					),
				);
			}
			if (chain[0] === "FormatNumber" || statics.length || nested.length) {
				return uniqueItems(filterPrefix([...type.members.values(), ...nested], prefix));
			}
		}
		const inferred = inferChain(index, chain, owner, locals);
		let typeName = inferred && inferred.type;
		if (!typeName || typeName === "auto" || (chain.length === 1 && !index.types.has(typeName))) {
			typeName = inferGetService(tokens, opIndex) || inferRhsType(tokens, 0) || typeName;
		}
		let items = [];
		if (typeName === "DataPath" || (inferred && inferred.pathNode)) {
			items = pathMembers(index, inferred && inferred.pathNode ? inferred.pathNode : "TemplateData").map((member) => ({
				...member,
				detail: `DataPath ${member.name}`,
			}));
		}
		if (!items.length) {
			items = membersOf(index, typeName);
		}
		if (op.value === "::") {
			items = items.filter((member) => member.static || member.kind === "enum" || member.kind === "constructor" || member.kind === "class");
			if (!items.length) {
				items = membersOf(index, typeName);
			}
		}
		return uniqueItems(filterPrefix(items, prefix));
	}

	const items = [];
	for (const word of KEYWORDS) {
		items.push({ name: word, kind: "keyword", type: "keyword", detail: word });
	}
	for (const item of index.globals.values()) {
		items.push(item);
	}
	for (const item of locals.values()) {
		items.push({ ...item, detail: `${item.type} ${item.name}` });
	}
	if (owner) {
		items.push({ name: "this", kind: "variable", type: owner, detail: `${owner}* this` });
		items.push(...membersOf(index, owner));
	}
	for (const name of INSTANCE_TYPES) {
		items.push({ name, kind: "class", type: name, detail: `new ${name}(parent)` });
	}
	for (const name of SERVICES) {
		items.push({ name, kind: "class", type: name, detail: `GetService<${name}>()` });
	}
	for (const type of index.types.keys()) {
		items.push({ name: type, kind: "class", type, detail: type });
	}
	return uniqueItems(filterPrefix(items, prefix)).slice(0, 200);
}

function hoverAt(source, offset, options = {}) {
	const items = completeAt(source, offset, options);
	const tokens = tokenize(source);
	const token = tokens[tokenIndexAt(tokens, offset)];
	if (!token || token.type !== "ident") {
		return items[0] ? { name: items[0].name, detail: items[0].detail, type: items[0].type } : null;
	}
	const match = items.find((item) => item.name === token.value) || completeAt(source.slice(0, token.start) + source.slice(token.end), token.start, options).find((item) => item.name === token.value);
	if (match) {
		return { name: match.name, detail: match.detail, type: match.type, kind: match.kind };
	}
	return { name: token.value, detail: token.value, type: "auto" };
}

function definitionAt(source, offset, options = {}) {
	const projectRoot = options.projectRoot || process.cwd();
	const file = options.file;
	const tokens = tokenize(source);
	const token = tokens[tokenIndexAt(tokens, offset)];
	if (!token) {
		return null;
	}
	if (token.type === "string" && file) {
		const { text } = lineAtOffset(source, offset);
		if (/^\s*#\s*include/.test(text)) {
			const name = token.value;
			const index = indexProject(projectRoot);
			const quoted = path.resolve(path.dirname(file), name);
			const angled = path.join(index.includeDir, name);
			const target = fs.existsSync(quoted) ? quoted : fs.existsSync(angled) ? angled : null;
			if (target) {
				return { file: target, line: 1, col: 1 };
			}
		}
	}
	if (token.type !== "ident") {
		return null;
	}
	const srcDir = path.join(projectRoot, "src");
	if (!fs.existsSync(srcDir)) {
		return { file: file || srcDir, line: token.line, col: token.col };
	}
	for (const candidate of collectFiles(srcDir).filter((entry) => isCppFile(entry))) {
		const text = fs.readFileSync(candidate, "utf8");
		const match = text.match(new RegExp(`(?:struct|class)\\s+${token.value}\\b`)) || text.match(new RegExp(`\\b${token.value}\\s*\\(`));
		if (match) {
			const before = text.slice(0, match.index);
			const line = before.split(/\n/).length;
			return { file: candidate, line, col: 1 };
		}
	}
	return { file: file || srcDir, line: token.line, col: token.col };
}

function diagnosticsFor(source, fileName, options = {}) {
	try {
		const { parse } = require("./parse");
		const { preprocess } = require("./preprocess");
		const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
		parse(prepared, fileName || "input.cpp");
		return [];
	} catch (err) {
		const message = err && err.message ? String(err.message) : "parse error";
		const match = message.match(/:(\d+):(\d+):\s*(.*)$/);
		if (match) {
			return [{ line: Number(match[1]), col: Number(match[2]), message: match[3], severity: "error" }];
		}
		return [{ line: err.line || 1, col: err.col || 1, message, severity: "error" }];
	}
}

function intelliSenseMode() {
	const arch = process.arch === "arm64" ? "arm64" : "x64";
	if (process.platform === "win32") {
		return `windows-clang-${arch}`;
	}
	if (process.platform === "darwin") {
		return `macos-clang-${arch}`;
	}
	return `linux-clang-${arch}`;
}

function clangPath() {
	const windows = "C:/Program Files/LLVM/bin/clang++.exe";
	if (process.platform === "win32" && fs.existsSync(windows)) {
		return windows;
	}
	return "clang++";
}

function compileCommandEntry(root, file) {
	const absRoot = posix(path.resolve(root));
	const absFile = posix(path.resolve(file));
	return {
		directory: absRoot,
		file: absFile,
		arguments: [
			clangPath(),
			"-xc++",
			"-std=c++20",
			"-ferror-limit=0",
			"-I" + posix(path.join(absRoot, "include")),
			"-I" + posix(path.join(absRoot, "src")),
			"-c",
			absFile,
		],
	};
}

function writeCompileCommands(root, srcDir) {
	const files = collectFiles(srcDir).filter((file) => isCppFile(file)).sort();
	const json = JSON.stringify(files.map((file) => compileCommandEntry(root, file)), null, "\t") + "\n";
	const dest = path.join(root, "compile_commands.json");
	if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === json) {
		return false;
	}
	fs.writeFileSync(dest, json, "utf8");
	return true;
}

function writeClangd(root) {
	const absInclude = posix(path.resolve(root, "include"));
	const absSrc = posix(path.resolve(root, "src"));
	const contents = `CompileFlags:
  Add:
    - -xc++
    - -std=c++20
    - -ferror-limit=0
    - -I${absInclude}
    - -I${absSrc}
    - -Iinclude
    - -Isrc

Diagnostics:
  Suppress: '*'

---
If:
  PathMatch: (out|libs)/.*
Index:
  Background: Skip
`;
	const dest = path.join(root, ".clangd");
	if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === contents) {
		return false;
	}
	fs.writeFileSync(dest, contents, "utf8");
	return true;
}

function mergeJson(file, patch) {
	let current = {};
	if (fs.existsSync(file)) {
		try {
			current = JSON.parse(fs.readFileSync(file, "utf8"));
		} catch {
			current = {};
		}
	}
	const next = { ...current, ...patch };
	for (const key of Object.keys(patch)) {
		if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && current[key] && typeof current[key] === "object") {
			next[key] = { ...current[key], ...patch[key] };
		}
	}
	const json = JSON.stringify(next, null, "\t") + "\n";
	if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === json) {
		return false;
	}
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, json, "utf8");
	return true;
}

function writeVscode(root) {
	const settings = path.join(root, ".vscode", "settings.json");
	mergeJson(settings, {
		"C_Cpp.intelliSenseEngine": "default",
		"C_Cpp.default.cppStandard": "c++20",
		"C_Cpp.default.cStandard": "c17",
		"C_Cpp.default.compilerPath": clangPath(),
		"C_Cpp.default.intelliSenseMode": intelliSenseMode(),
		"C_Cpp.default.includePath": ["${workspaceFolder}/include", "${workspaceFolder}/src"],
		"clangd.enable": false,
		"files.associations": {
			"*.hpp": "cpp",
			"*.h": "cpp",
			"*.server.cpp": "cpp",
			"*.client.cpp": "cpp",
			"*.plugin.cpp": "cpp",
			"*.legacy.cpp": "cpp",
			"*.legacy.server.cpp": "cpp",
			"*.legacy.client.cpp": "cpp",
		},
	});
	mergeJson(path.join(root, ".vscode", "extensions.json"), {
		recommendations: ["ms-vscode.cpptools", "kartzdev.cluaupp-intellisense"],
	});
	const props = path.join(root, ".vscode", "c_cpp_properties.json");
	const nextProps = {
		configurations: [
			{
				name: "Cluaupp",
				compilerPath: clangPath(),
				cStandard: "c17",
				cppStandard: "c++20",
				intelliSenseMode: intelliSenseMode(),
				includePath: ["${workspaceFolder}/include", "${workspaceFolder}/src"],
				forcedInclude: ["${workspaceFolder}/include/cluaupp/roblox.hpp"],
				compileCommands: "${workspaceFolder}/compile_commands.json",
				browse: {
					path: ["${workspaceFolder}/include", "${workspaceFolder}/src"],
					limitSymbolsToIncludedHeaders: true,
				},
			},
		],
		version: 4,
	};
	const json = JSON.stringify(nextProps, null, "\t") + "\n";
	fs.mkdirSync(path.dirname(props), { recursive: true });
	if (!fs.existsSync(props) || fs.readFileSync(props, "utf8") !== json) {
		fs.writeFileSync(props, json, "utf8");
	}
}

function copyDir(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyDir(src, dest);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

function installEditorExtension(cluauppRoot = PACKAGE_ROOT) {
	const from = path.join(cluauppRoot, "editors", "vscode");
	if (!fs.existsSync(from)) {
		return [];
	}
	const id = `kartzdev.cluaupp-intellisense-${pkg.version}`;
	const homes = [
		path.join(os.homedir(), ".cursor", "extensions"),
		path.join(os.homedir(), ".vscode", "extensions"),
	];
	const installed = [];
	for (const home of homes) {
		if (!fs.existsSync(path.dirname(home))) {
			continue;
		}
		fs.mkdirSync(home, { recursive: true });
		const dest = path.join(home, id);
		copyDir(from, dest);
		fs.writeFileSync(path.join(dest, "cluaupp.root"), path.resolve(cluauppRoot), "utf8");
		installed.push(dest);
	}
	return installed;
}

function syncEditorSupport(root, config = {}) {
	const srcDir = path.join(root, config.rootDir || "src");
	if (fs.existsSync(srcDir)) {
		writeCompileCommands(root, srcDir);
	}
	writeClangd(root);
	writeVscode(root);
	const flags = "-xc++\n-std=c++20\n-ferror-limit=0\n-Iinclude\n-Isrc\n";
	const flagsFile = path.join(root, "compile_flags.txt");
	if (!fs.existsSync(flagsFile) || fs.readFileSync(flagsFile, "utf8") !== flags) {
		fs.writeFileSync(flagsFile, flags, "utf8");
	}
}

async function installEditorSupport(cluauppRoot = PACKAGE_ROOT) {
	const { installCppTools, reportCppTools } = require("./editor-install");
	const local = installEditorExtension(cluauppRoot);
	const cpp = await installCppTools();
	reportCppTools(cpp);
	return { local, cpp };
}

module.exports = {
	completeAt,
	hoverAt,
	definitionAt,
	diagnosticsFor,
	indexProject,
	syncEditorSupport,
	installEditorExtension,
	installEditorSupport,
	writeCompileCommands,
	intelliSenseMode,
	clangPath,
};
