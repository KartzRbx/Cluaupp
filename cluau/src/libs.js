"use strict";

const MODULES = {
	Janitor: { file: "Janitor", bind: "Janitor" },
	Promise: { file: "Promise", bind: "Promise" },
	Net: { file: "Net", bind: "Net" },
	NetEvent: { file: "Net", bind: "Net" },
	NetFunction: { file: "Net", bind: "Net" },
	MathUtils: { file: "MathUtils", bind: "MathUtils" },
	FormatNumber: { file: "FormatNumber", bind: "FormatNumber" },
	Module3D: { file: "Module3D", bind: "Module3D" },
	Model3D: { file: "Module3D", bind: "Module3D" },
	Twinkle: { file: "Twinkle", bind: "Twinkle" },
	DataService: { file: "DataService", bind: "DataService" },
	EzVisualz: { file: "EzVisualz", bind: "EzVisualz" },
	EzVisual: { file: "EzVisualz", bind: "EzVisualz" },
	Spring: { file: "Spring", bind: "Spring" },
	Display: { file: "Display", bind: "Display" },
	StickyBillboard: { file: "StickyBillboard", bind: "StickyBillboard" },
	Icon: { file: "TopbarPlus", bind: "Icon" },
	TopbarPlus: { file: "TopbarPlus", bind: "Icon" },
	Cmdr: { file: "Cmdr", bind: "Cmdr" },
	Chrono: { file: "Chrono", bind: "Chrono" },
	Iris: { file: "Iris", bind: "Iris" },
	Fusion: { file: "Fusion", bind: "Fusion" },
	StateMachine: { file: "StateMachine", bind: "StateMachine" },
	VfxUtil: { file: "VfxUtil", bind: "VfxUtil" },
};

const INCLUDE_TO_MODULE = {
	janitor: "Janitor",
	promise: "Promise",
	net: "Net",
	math: "MathUtils",
	mathutils: "MathUtils",
	formatnumber: "FormatNumber",
	module3d: "Module3D",
	dataservice: "DataService",
	dataservicev2: "DataService",
	ezvisual: "EzVisualz",
	ezvisualz: "EzVisualz",
	twinkle: "Twinkle",
	spring: "Spring",
	display: "Display",
	stickybillboard: "StickyBillboard",
	topbarplus: "Icon",
	icon: "Icon",
	cmdr: "Cmdr",
	chrono: "Chrono",
	iris: "Iris",
	fusion: "Fusion",
	statemachine: "StateMachine",
	robloxstatemachine: "StateMachine",
	vfx: "VfxUtil",
	vfxutil: "VfxUtil",
	libs: null,
};

const LIBRARY_TYPES = new Set(Object.keys(MODULES));

const LIBRARY_METHODS = new Set([
	"Add",
	"AddObject",
	"AddPromise",
	"Remove",
	"RemoveNoClean",
	"RemoveList",
	"GetAll",
	"Cleanup",
	"Destroy",
	"LinkToInstance",
	"LinkToInstances",
	"Has",
	"Then",
	"Catch",
	"Finally",
	"Await",
	"Cancel",
	"Fire",
	"FireAll",
	"On",
	"OnClient",
	"OnServer",
	"Invoke",
	"InvokeServer",
	"InvokeClient",
	"Attach3D",
	"Update",
	"SetCFrame",
	"GetCFrame",
	"SetDepthMultiplier",
	"GetDepthMultiplier",
	"GetPersisted",
	"SetTransient",
	"UpdateTransient",
	"ClearTransient",
	"GetOrderedList",
	"GetOrderedListWithPriority",
	"WaitFor",
	"Observe",
	"Impulse",
	"SetGoal",
	"Set",
	"Get",
	"Step",
	"Fade",
	"FrameSlide",
	"FrameZoom",
	"FrameBounce",
	"ShowText",
	"SetButtonStyle",
	"FadeSlideRunoff",
	"Abbreviate",
	"Comma",
	"Compact",
	"Play",
	"Pause",
	"Resume",
	"Stop",
	"BindEvent",
	"bindEvent",
	"BindFunction",
	"RegisterDefaultCommands",
	"RegisterHook",
	"RegisterType",
	"RegisterCommand",
	"ChangeState",
	"GetState",
	"GetCurrentState",
	"GetPreviousState",
	"GetData",
	"ChangeData",
	"LoadDirectory",
	"setLabel",
	"setImage",
	"setEnabled",
	"setName",
	"setOrder",
	"setWidth",
	"align",
	"setLeft",
	"setMid",
	"setRight",
	"bindToggleItem",
	"modifyTheme",
	"setTheme",
	"notify",
	"clearNotices",
	"select",
	"deselect",
	"autoDeselect",
	"SetText",
	"SetEnabled",
	"SetMaxDistance",
	"SetActive",
	"GetActive",
	"End",
	"Scale",
	"DestroyAfter",
	"Burst",
	"CloneOnto",
	"Shutdown",
	"Append",
	"PushConfig",
	"PopConfig",
	"ForceRefresh",
]);

const MODULE_COLON = new Set(["Attach3D", "RegisterDefaultCommands", "RegisterHook", "Connect", "LoadDirectory"]);

function isLibraryType(name) {
	return LIBRARY_TYPES.has(name);
}

function isLibraryMethod(name) {
	return LIBRARY_METHODS.has(name);
}

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

function modulesFromIncludes(source) {
	const found = new Set();
	for (const line of String(source).split(/\r?\n/)) {
		const match = line.match(/^\s*#\s*include\s+<cluaupp\/(?:libs\/)?([A-Za-z0-9]+)\.hpp>/);
		if (!match) {
			continue;
		}
		const key = match[1].toLowerCase();
		const mapped = INCLUDE_TO_MODULE[key];
		if (mapped) {
			found.add(mapped);
		}
		if (key === "libs") {
			found.add("Janitor");
			found.add("Promise");
			found.add("Net");
			found.add("MathUtils");
			found.add("FormatNumber");
			found.add("Module3D");
			found.add("Twinkle");
			found.add("DataService");
		}
	}
	return found;
}

function collectLibraries(source, ast) {
	const used = modulesFromIncludes(source);
	walk(ast, (node) => {
		if (node.type === "ident" && MODULES[node.name]) {
			used.add(node.name === "NetEvent" || node.name === "NetFunction" ? "Net" : node.name);
		}
		if (node.type === "new" && MODULES[node.className]) {
			used.add(node.className === "NetEvent" || node.className === "NetFunction" ? "Net" : node.className);
		}
		if (node.type === "call" && node.object && node.object.type === "ident" && MODULES[node.object.name]) {
			const name = node.object.name;
			used.add(name === "NetEvent" || name === "NetFunction" ? "Net" : name);
		}
	});
	const unique = [];
	const seenBind = new Set();
	for (const name of used) {
		const spec = MODULES[name];
		if (!spec || seenBind.has(spec.bind)) {
			continue;
		}
		seenBind.add(spec.bind);
		unique.push(spec);
	}
	return unique;
}

function emitRequires(libraries) {
	if (!libraries.length) {
		return "";
	}
	const lines = libraries.map((spec) => {
		return `local ${spec.bind} = require(game:GetService("ReplicatedStorage"):WaitForChild("CluauppLibs"):WaitForChild("${spec.file}"))`;
	});
	return `${lines.join("\n")}\n`;
}

function insertRequires(luau, libraries) {
	const block = emitRequires(libraries);
	if (!block) {
		return luau;
	}
	const marker = "-- Compiled by Cluaupp — C++ × Luau";
	const index = luau.indexOf(marker);
	if (index === -1) {
		return `${block}\n${luau}`;
	}
	const insertAt = luau.indexOf("\n", index);
	if (insertAt === -1) {
		return `${luau}\n${block}`;
	}
	return `${luau.slice(0, insertAt + 1)}\n${block}${luau.slice(insertAt + 1)}`;
}

module.exports = {
	MODULES,
	LIBRARY_TYPES,
	LIBRARY_METHODS,
	MODULE_COLON,
	isLibraryType,
	isLibraryMethod,
	collectLibraries,
	insertRequires,
};
