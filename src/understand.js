"use strict";

const path = require("path");
const { luauType } = require("./api");

const EXT = "(cpp|cc|cxx|c|h|hpp|hh)";

const VALUE_CLASSES = {
	IntValue: { luau: "number", instance: "IntValue", fallback: "0" },
	NumberValue: { luau: "number", instance: "NumberValue", fallback: "0" },
	StringValue: { luau: "string", instance: "StringValue", fallback: '""' },
	BoolValue: { luau: "boolean", instance: "BoolValue", fallback: "false" },
};

// roblox-ts ScriptType is a filename key. Flamework then stamps
// @Service / @Controller identifiers. Cluaupp uses the same first key
// (.server / .client / .legacy.* / none) then scores AST intents.
const INTENTS = {
	players: {
		role: "manager",
		module: "PlayersManager",
		tokens: ["GetPlayers", "PlayerAdded", "PlayerRemoving", "Players"],
	},
	cache: {
		role: "controller",
		module: "CacheController",
		tokens: ["Folder", "IntValue", "StringValue", "BoolValue", "NumberValue", "leaderstats"],
	},
	combat: {
		role: "controller",
		module: "CombatController",
		tokens: [
			"TakeDamage",
			"Humanoid",
			"Raycast",
			"RaycastParams",
			"Hitbox",
			"Health",
			"Damage",
			"Weapon",
			"Tool",
			"Activated",
			"Combat",
			"Hurt",
			"Attack",
		],
	},
	input: {
		role: "controller",
		module: "InputController",
		tokens: [
			"UserInputService",
			"ContextActionService",
			"InputBegan",
			"InputEnded",
			"InputChanged",
			"Mouse",
			"GetMouse",
			"PreferredInput",
		],
	},
	ui: {
		role: "controller",
		module: "ViewController",
		tokens: [
			"PlayerGui",
			"ScreenGui",
			"BillboardGui",
			"SurfaceGui",
			"TextLabel",
			"TextButton",
			"Frame",
			"ImageLabel",
			"TweenService",
			"Twinkle",
		],
	},
	net: {
		role: "controller",
		module: "NetController",
		tokens: [
			"RemoteEvent",
			"RemoteFunction",
			"UnreliableRemoteEvent",
			"FireServer",
			"FireAllClients",
			"FireClient",
			"OnServerEvent",
			"OnClientEvent",
			"Net",
			"NetEvent",
		],
	},
	data: {
		role: "controller",
		module: "DataController",
		tokens: [
			"DataStore",
			"DataStoreService",
			"DataService",
			"SetAsync",
			"GetAsync",
			"UpdateAsync",
			"ProfileStore",
			"GetChangedSignal",
			"WaitFor",
			"Paths",
		],
	},
	character: {
		role: "controller",
		module: "CharacterController",
		tokens: ["CharacterAdded", "CharacterRemoving", "HumanoidRootPart", "GetPivot", "PivotTo", "Character"],
	},
	animation: {
		role: "controller",
		module: "AnimationController",
		tokens: ["Animator", "Animation", "AnimationTrack", "LoadAnimation"],
	},
	inventory: {
		role: "controller",
		module: "InventoryController",
		tokens: ["Backpack", "Inventory"],
	},
};

function walk(node, visit) {
	if (!node || typeof node !== "object") {
		return;
	}
	visit(node);
	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				walk(item, visit);
			}
		} else if (value && typeof value === "object") {
			walk(value, visit);
		}
	}
}

function namesIn(ast, options = {}) {
	const found = new Set();
	walk(ast, (node) => {
		if (node.type === "call" && node.name) {
			found.add(node.name);
		}
		if (node.type === "member" && node.name) {
			found.add(node.name);
		}
		if (node.type === "ident" && node.name) {
			found.add(node.name);
		}
		if (node.type === "new" && node.className) {
			found.add(node.className);
		}
		if (node.type === "getService" && node.service) {
			found.add(node.service);
		}
		if (options.strings !== false && node.type === "string" && node.value) {
			found.add(node.value);
		}
	});
	return found;
}

function capitalize(word) {
	if (!word) {
		return word;
	}
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function toPascalServiceName(fileName) {
	let base = path.basename(fileName).replace(new RegExp(`\\.${EXT}$`, "i"), "");
	base = base.replace(/\.legacy\.(server|client)$/i, "");
	base = base.replace(/\.(server|client)$/i, "");
	if (/^init$/i.test(base)) {
		const folder = path.basename(path.dirname(fileName) || "");
		if (folder && folder !== "." && folder !== "src") {
			return capitalize(folder);
		}
		return "Init";
	}
	if (/stats$/i.test(base) && !/Stats$/.test(base)) {
		return capitalize(base.slice(0, -5)) + "Stats";
	}
	if (/[-_]/.test(base)) {
		return base
			.split(/[-_]+/)
			.filter(Boolean)
			.map(capitalize)
			.join("");
	}
	return capitalize(base);
}

function parseFileTag(fileName) {
	const base = path.basename(fileName);
	if (new RegExp(`\\.legacy\\.plugin\\.${EXT}$`, "i").test(base)) {
		return { key: "legacy.plugin", emit: "legacy", runtime: "plugin", rojo: "Script", runContext: "Plugin" };
	}
	if (new RegExp(`\\.legacy\\.server\\.${EXT}$`, "i").test(base)) {
		return { key: "legacy.server", emit: "legacy", runtime: "server", rojo: "Script", runContext: null };
	}
	if (new RegExp(`\\.legacy\\.client\\.${EXT}$`, "i").test(base)) {
		return { key: "legacy.client", emit: "legacy", runtime: "client", rojo: "LocalScript", runContext: null };
	}
	if (new RegExp(`\\.legacy\\.${EXT}$`, "i").test(base)) {
		return { key: "legacy", emit: "legacy", runtime: "server", rojo: "Script", runContext: null };
	}
	if (new RegExp(`\\.plugin\\.${EXT}$`, "i").test(base)) {
		return { key: "plugin", emit: "service", runtime: "plugin", rojo: "Script", runContext: "Plugin" };
	}
	if (new RegExp(`\\.server\\.${EXT}$`, "i").test(base)) {
		return { key: "server", emit: "service", runtime: "server", rojo: "Script", runContext: null };
	}
	if (new RegExp(`\\.client\\.${EXT}$`, "i").test(base)) {
		return { key: "client", emit: "service", runtime: "client", rojo: "LocalScript", runContext: null };
	}
	return { key: "module", emit: "module", runtime: "shared", rojo: "ModuleScript", runContext: null };
}

function scoreIntents(named) {
	const scored = [];
	for (const [name, spec] of Object.entries(INTENTS)) {
		const evidence = spec.tokens.filter((token) => named.has(token));
		if (evidence.length === 0) {
			continue;
		}
		scored.push({
			name,
			score: evidence.length,
			evidence,
			role: spec.role,
			module: spec.module,
		});
	}
	scored.sort((a, b) => b.score - a.score);
	return scored;
}

function literal(node) {
	if (!node) {
		return null;
	}
	if (node.type === "number") {
		return node.value;
	}
	if (node.type === "string") {
		return `"${node.value}"`;
	}
	if (node.type === "bool") {
		return node.value ? "true" : "false";
	}
	if (node.type === "null") {
		return "nil";
	}
	return null;
}

function collectStats(ast) {
	const stats = [];
	let folderName = null;
	const seen = new Set();

	for (const decl of ast.body || []) {
		if (decl.type !== "function" || !decl.body) {
			continue;
		}
		const locals = new Map();
		for (const stmt of decl.body) {
			if (stmt.type === "decl" && stmt.value && stmt.value.type === "new") {
				locals.set(stmt.name, {
					className: stmt.value.className,
					statName: null,
					defaultValue: null,
				});
			}
			if (stmt.type !== "expr" || !stmt.expr || stmt.expr.type !== "assign") {
				continue;
			}
			const left = stmt.expr.left;
			if (!left || left.type !== "member" || !left.object || left.object.type !== "ident") {
				continue;
			}
			const record = locals.get(left.object.name);
			if (!record) {
				continue;
			}
			if (left.name === "Name" && stmt.expr.right && stmt.expr.right.type === "string") {
				record.statName = stmt.expr.right.value;
				if (record.className === "Folder") {
					folderName = record.statName;
				}
			}
			if (left.name === "Value") {
				record.defaultValue = literal(stmt.expr.right);
			}
		}
		for (const record of locals.values()) {
			const spec = VALUE_CLASSES[record.className];
			if (!spec || !record.statName || seen.has(record.statName)) {
				continue;
			}
			seen.add(record.statName);
			stats.push({
				name: record.statName,
				instance: spec.instance,
				luau: spec.luau,
				defaultValue: record.defaultValue != null ? record.defaultValue : spec.fallback,
			});
		}
	}

	return { stats, folderName: folderName || (stats.length > 0 ? "leaderstats" : null) };
}

function collectConsts(ast) {
	const consts = [];
	for (const decl of ast.body || []) {
		if (decl.type === "decl" && decl.isConst) {
			consts.push({
				name: decl.name,
				luau: luauType(decl.valueType) || "number",
				value: literal(decl.value) || "nil",
			});
		}
	}
	return consts;
}

function onlyConsts(ast) {
	const body = ast.body || [];
	if (body.length === 0) {
		return false;
	}
	return body.every((node) => node.type === "decl" || node.type === "proto");
}

function looksLikeCacheSetup(fn) {
	if (!fn || !fn.body) {
		return false;
	}
	const named = namesIn(fn);
	return [...Object.keys(VALUE_CLASSES), "Folder"].some((name) => named.has(name));
}

function isTrivial(ast) {
	const fns = (ast.body || []).filter((node) => node.type === "function");
	if (fns.length === 0) {
		return (ast.body || []).every((node) => node.type === "proto" || node.type === "decl");
	}
	if (fns.some((fn) => fn.name !== "init")) {
		return false;
	}
	const init = fns.find((fn) => fn.name === "init");
	const named = namesIn(init || { body: [] }, { strings: false });
	const interesting = [...named].filter((name) => !["print", "warn", "error"].includes(name) && !/^[0-9.]+$/.test(name));
	return interesting.length === 0;
}

function classifyFunctions(ast, intents) {
	const primary = intents.find((item) => item.name !== "players" && item.name !== "cache");
	const classified = [];
	for (const decl of ast.body || []) {
		if (decl.type !== "function" || decl.name === "init") {
			continue;
		}
		const named = namesIn(decl);
		const localIntents = scoreIntents(named);
		let absorb = "none";
		if (looksLikeCacheSetup(decl)) {
			absorb = "cache";
		}
		const top = localIntents[0];
		classified.push({
			name: decl.name,
			decl,
			intent: top ? top.name : primary ? primary.name : "domain",
			absorb,
		});
	}
	keepReferencedFunctions(ast, classified);
	return classified;
}

function keepReferencedFunctions(ast, classified) {
	const kept = new Set(["init"]);
	for (const item of classified) {
		if (item.absorb !== "cache") {
			kept.add(item.name);
		}
	}

	let changed = true;
	while (changed) {
		changed = false;
		for (const decl of ast.body || []) {
			if (decl.type !== "function" || !kept.has(decl.name)) {
				continue;
			}
			const named = namesIn(decl);
			for (const item of classified) {
				if (item.absorb === "cache" && named.has(item.name)) {
					item.absorb = "none";
					kept.add(item.name);
					changed = true;
				}
			}
		}
	}
}

function analyze(ast, fileName) {
	const tag = parseFileTag(fileName);
	const named = namesIn(ast);
	const { stats, folderName } = collectStats(ast);
	const consts = collectConsts(ast);
	const intents = scoreIntents(named);
	const functions = classifyFunctions(ast, intents);
	const trivial = isTrivial(ast);
	const constsOnly = onlyConsts(ast);
	const hasPlayers = intents.some((item) => item.name === "players");
	const hasCache = intents.some((item) => item.name === "cache") || stats.length > 0;
	const primaryDomain = intents.find((item) => item.name !== "players" && item.name !== "cache") || null;
	const serviceName = toPascalServiceName(fileName);
	const configLike =
		tag.emit === "module" &&
		(constsOnly || (consts.length > 0 && !hasPlayers && stats.length === 0 && !primaryDomain));

	let kind = "flat";
	if (tag.emit === "legacy") {
		kind = "legacy";
	} else if (tag.emit === "module") {
		kind = configLike ? "config" : "module";
	} else if (tag.emit === "service") {
		kind = trivial ? "flat" : "service";
	}

	const roles = {
		players: kind === "service" && hasPlayers,
		cache: kind === "service" && (hasCache || stats.length > 0),
		domain: null,
	};
	if (kind === "service" && primaryDomain) {
		roles.domain = primaryDomain.module;
	} else if (kind === "service" && !roles.cache && !roles.players) {
		roles.domain = `${serviceName}Controller`;
	}

	const reasoning = [
		`tag ${tag.key} → ${tag.rojo} (${tag.emit})`,
		intents.length > 0
			? `intents ${intents.map((item) => `${item.name}:${item.score}`).join(", ")}`
			: "intents (none — entry or module)",
		kind === "service"
			? `roles ${["Main", roles.players ? "PlayersManager" : null, roles.cache ? "CacheController" : null, roles.domain, `${serviceName}Types`].filter(Boolean).join(", ")}`
			: `kind ${kind}`,
	];

	return {
		tag,
		kind,
		onlyConsts: constsOnly,
		trivial,
		serviceName,
		typesName: `${serviceName}Types`,
		isClient: tag.runtime === "client",
		runContext: tag.runContext || null,
		intents,
		primaryDomain,
		roles,
		stats,
		folderName,
		consts,
		functions,
		fileName,
		reasoning,
	};
}

function modernScriptOutName(relativeName) {
	return String(relativeName)
		.replace(/\\/g, "/")
		.replace(/\.(server|client|plugin)\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau");
}

function legacyOutName(relativeName) {
	return String(relativeName)
		.replace(/\\/g, "/")
		.replace(/\.legacy\.plugin\./i, ".")
		.replace(/\.legacy\.(server|client)\./i, ".$1.")
		.replace(/\.legacy\./i, ".server.")
		.replace(new RegExp(`\\.${EXT}$`, "i"), ".luau");
}

module.exports = {
	VALUE_CLASSES,
	INTENTS,
	walk,
	namesIn,
	parseFileTag,
	toPascalServiceName,
	scoreIntents,
	analyze,
	legacyOutName,
	modernScriptOutName,
	looksLikeCacheSetup,
};
