"use strict";

const path = require("path");
const { emit } = require("./emit");
const { collectLibraries, insertRequires, requireCluauppLib } = require("./libs");
const {
	VALUE_CLASSES,
	analyze,
	toPascalServiceName,
	legacyOutName,
} = require("./understand");

function header(plan) {
	const lines = ["--!strict", "-- Compiled by Cluaupp — C++ × Luau"];
	if (plan && plan.reasoning) {
		for (const line of plan.reasoning) {
			lines.push(`-- ${line}`);
		}
	}
	lines.push("");
	return lines.join("\n");
}

function cluauppLib(name) {
	return requireCluauppLib(name);
}

function emitTypes(plan) {
	const lines = [header(plan).trimEnd(), ""];
	lines.push('local ReplicatedStorage = game:GetService("ReplicatedStorage")');
	lines.push(`local Occlude = ${cluauppLib("Occlude")}`);
	lines.push(`local ArrayIndexer = ${cluauppLib("ArrayIndexer")}`);
	lines.push("");

	if (plan.stats.length > 0) {
		const union = plan.stats.map((stat) => `"${stat.name}"`).join(" | ");
		lines.push(`export type StatName = ${union}`);
		lines.push("");
		lines.push(`export type ${plan.serviceName}Data = {`);
		for (const stat of plan.stats) {
			lines.push(`	${stat.name}: ${stat.luau},`);
		}
		lines.push("}");
		lines.push("");
	}

	if (plan.roles.cache) {
		lines.push("export type PlayerCache = {");
		lines.push("	Folder: Folder,");
		for (const stat of plan.stats) {
			lines.push(`	${stat.name}: ${stat.instance},`);
		}
		lines.push("}");
		lines.push("");
	}

	const manifest = [];
	if (plan.roles.cache) {
		manifest.push("	CacheController: {");
		manifest.push("		Get: (player: Player) -> PlayerCache?,");
		manifest.push("		Ensure: (player: Player) -> PlayerCache,");
		manifest.push("		Clear: (player: Player) -> (),");
		manifest.push("	},");
	}
	if (plan.roles.players) {
		manifest.push("	PlayersManager: {");
		manifest.push("		Start: (onPlayer: (player: Player) -> (), onLeave: ((player: Player) -> ())?) -> (),");
		manifest.push("		Stop: () -> (),");
		manifest.push("	},");
	}
	if (plan.roles.domain) {
		manifest.push(`	${plan.roles.domain}: {`);
		manifest.push("		Start: () -> (),");
		manifest.push("		Stop: () -> (),");
		manifest.push("	},");
	}
	lines.push("export type ServiceManifest = {");
	if (manifest.length === 0) {
		lines.push("	Main: { Start: () -> (), Stop: () -> () },");
	} else {
		lines.push(...manifest);
	}
	lines.push("}");
	lines.push("");
	if (plan.roles.cache) {
		lines.push('export type CacheService = ArrayIndexer.Table<ServiceManifest, "CacheController">');
	} else if (plan.roles.domain) {
		lines.push(`export type DomainService = ArrayIndexer.Table<ServiceManifest, "${plan.roles.domain}">`);
	} else {
		lines.push('export type MainService = ArrayIndexer.Table<ServiceManifest, "Main">');
	}
	if (plan.stats.length > 1) {
		const hide = plan.stats[plan.stats.length - 1].name;
		lines.push(`export type HudData = Occlude.Keys<${plan.serviceName}Data, "${hide}">`);
	}
	lines.push("");
	lines.push("return {}");
	lines.push("");
	return lines.join("\n");
}

function emitPlayersManager(plan) {
	return `${header(plan)}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Janitor = ${cluauppLib("Janitor")}
type Janitor = Janitor.Janitor

export type PlayerHandler = (player: Player) -> ()

local PlayersManager = {}
local lifetime: Janitor? = nil

function PlayersManager.Start(onPlayer: PlayerHandler, onLeave: PlayerHandler?)
	PlayersManager.Stop()
	local janitor = Janitor.new()
	lifetime = janitor

	local function accept(player: Player)
		onPlayer(player)
	end

	for _, player in Players:GetPlayers() do
		accept(player)
	end

	janitor:Add(Players.PlayerAdded:Connect(accept), "Disconnect", "PlayerAdded")
	if onLeave then
		janitor:Add(Players.PlayerRemoving:Connect(onLeave), "Disconnect", "PlayerRemoving")
	end
end

function PlayersManager.Stop()
	if lifetime == nil then
		return
	end
	lifetime:Cleanup()
	lifetime = nil
end

return PlayersManager
`;
}

function emitCacheController(plan) {
	const types = plan.typesName;
	const folder = plan.folderName || "leaderstats";
	const lines = [header(plan).trimEnd(), ""];
	lines.push(`local Types = require(script.Parent.${types})`);
	lines.push("");
	lines.push(`local FOLDER_NAME = "${folder}"`);
	lines.push("local cache: { [Player]: Types.PlayerCache } = {}");
	lines.push("");
	lines.push("local CacheController = {}");
	lines.push("");
	lines.push("function CacheController.Get(player: Player): Types.PlayerCache?");
	lines.push("	return cache[player]");
	lines.push("end");
	lines.push("");
	lines.push("function CacheController.Ensure(player: Player): Types.PlayerCache");
	lines.push("	local existing = cache[player]");
	lines.push("	if existing then");
	lines.push("		return existing");
	lines.push("	end");
	lines.push("");
	lines.push("	local folderInstance = player:FindFirstChild(FOLDER_NAME)");
	lines.push("	local folder: Folder");
	lines.push('	if folderInstance and folderInstance:IsA("Folder") then');
	lines.push("		folder = folderInstance");
	lines.push("	else");
	lines.push('		folder = Instance.new("Folder")');
	lines.push("		folder.Name = FOLDER_NAME");
	lines.push("		folder.Parent = player");
	lines.push("	end");
	lines.push("");
	for (const stat of plan.stats) {
		const ident = stat.name;
		lines.push(`	local existing${ident} = folder:FindFirstChild("${stat.name}")`);
		lines.push(`	local ${ident}: ${stat.instance}`);
		lines.push(`	if existing${ident} and existing${ident}:IsA("${stat.instance}") then`);
		lines.push(`		${ident} = existing${ident}`);
		lines.push("	else");
		lines.push(`		${ident} = Instance.new("${stat.instance}")`);
		lines.push(`		${ident}.Name = "${stat.name}"`);
		lines.push(`		${ident}.Value = ${stat.defaultValue}`);
		lines.push(`		${ident}.Parent = folder`);
		lines.push("	end");
		lines.push("");
	}
	lines.push("	local record: Types.PlayerCache = {");
	lines.push("		Folder = folder,");
	for (const stat of plan.stats) {
		lines.push(`		${stat.name} = ${stat.name},`);
	}
	lines.push("	}");
	lines.push("	cache[player] = record");
	lines.push("	return record");
	lines.push("end");
	lines.push("");
	lines.push("function CacheController.Clear(player: Player)");
	lines.push("	cache[player] = nil");
	lines.push("end");
	lines.push("");
	lines.push("return CacheController");
	lines.push("");
	return lines.join("\n");
}

function emitMain(plan) {
	const lines = [header(plan).trimEnd(), ""];
	if (plan.roles.players) {
		lines.push("local PlayersManager = require(script.Parent.PlayersManager)");
	}
	if (plan.roles.cache) {
		lines.push("local CacheController = require(script.Parent.CacheController)");
	}
	if (plan.roles.domain) {
		lines.push(`local ${plan.roles.domain} = require(script.Parent.${plan.roles.domain})`);
	}
	lines.push("");
	lines.push("local Main = {}");
	lines.push("");
	lines.push("function Main.Start()");
	if (plan.roles.players && plan.roles.cache) {
		lines.push("	PlayersManager.Start(function(player: Player)");
		lines.push("		CacheController.Ensure(player)");
		lines.push("	end, function(player: Player)");
		lines.push("		CacheController.Clear(player)");
		lines.push("	end)");
	} else if (plan.roles.players) {
		lines.push("	PlayersManager.Start(function(_player: Player) end)");
	}
	if (plan.roles.domain) {
		lines.push(`	${plan.roles.domain}.Start()`);
	}
	if (!plan.roles.players && !plan.roles.domain) {
		lines.push("	return");
	}
	lines.push("end");
	lines.push("");
	lines.push("function Main.Stop()");
	if (plan.roles.domain) {
		lines.push(`	${plan.roles.domain}.Stop()`);
	}
	if (plan.roles.players) {
		lines.push("	PlayersManager.Stop()");
	}
	lines.push("end");
	lines.push("");
	lines.push("return Main");
	lines.push("");
	return lines.join("\n");
}

function emitBootstrap(plan) {
	return `${header(plan)}require(script.Main):Start()
`;
}

function emitConfig(plan, ast, options) {
	const lines = [];
	if (plan.onlyConsts) {
		lines.push(header(plan).trimEnd());
		lines.push("");
		for (const item of plan.consts) {
			lines.push(`const ${item.name}: ${item.luau} = ${item.value}`);
		}
	} else {
		lines.push(header(plan).trimEnd());
		lines.push("");
		lines.push(emit(ast, { ...options, skipHeader: true, skipInit: true }).trimEnd());
	}
	lines.push("");
	lines.push("return {");
	for (const item of plan.consts) {
		lines.push(`	${item.name} = ${item.name},`);
	}
	for (const decl of ast.body || []) {
		if (decl.type === "function" && decl.name !== "init") {
			lines.push(`	${decl.name} = ${decl.name},`);
		}
	}
	if ((ast.body || []).some((decl) => decl.type === "function" && decl.name === "init")) {
		lines.push("	Start = init,");
	}
	lines.push("}");
	lines.push("");
	return lines.join("\n");
}

function emitDomainController(plan, ast, options) {
	const absorbCache = plan.roles.cache;
	const keep = (ast.body || []).filter((decl) => {
		if (decl.type === "decl" || decl.type === "proto") {
			return true;
		}
		if (decl.type !== "function") {
			return false;
		}
		if (decl.name === "init") {
			return true;
		}
		const classified = plan.functions.find((item) => item.name === decl.name);
		if (absorbCache && classified && classified.absorb === "cache") {
			return false;
		}
		return true;
	});
	const subset = { type: "program", body: keep };
	const code = emit(subset, { ...options, skipHeader: true, skipInit: true }).trimEnd();
	const name = plan.roles.domain;
	const libs = collectLibraries(options.source || "", subset);
	const body = `${header(plan)}${code}

local ${name} = {}

function ${name}.Start()
	${keep.some((decl) => decl.type === "function" && decl.name === "init") ? "init()" : "return"}
end

function ${name}.Stop()
	return
end

return ${name}
`;
	return insertRequires(body, libs);
}

function emitModule(plan, ast, options) {
	return emitConfig(plan, ast, options);
}

function serviceFiles(plan, ast, options, dir) {
	const folder = `${dir}/${plan.serviceName}`;
	const boot = plan.isClient ? "init.client.luau" : "init.server.luau";
	const files = [{ name: `${folder}/${boot}`, contents: emitBootstrap(plan) }, { name: `${folder}/Main.luau`, contents: emitMain(plan) }];
	if (plan.roles.players) {
		files.push({ name: `${folder}/PlayersManager.luau`, contents: emitPlayersManager(plan) });
	}
	if (plan.roles.cache) {
		files.push({ name: `${folder}/CacheController.luau`, contents: emitCacheController(plan) });
	}
	if (plan.roles.domain) {
		files.push({ name: `${folder}/${plan.roles.domain}.luau`, contents: emitDomainController(plan, ast, options) });
	}
	files.push({ name: `${folder}/${plan.typesName}.luau`, contents: emitTypes(plan) });
	return files;
}

function planOutput(ast, fileName, options = {}) {
	const plan = analyze(ast, fileName);
	const rel = (options.relativeName || fileName).replace(/\\/g, "/");
	const dir = path.dirname(rel).replace(/^\.$/, "");
	const outDir = dir && dir !== "." ? dir : "";
	const prefix = outDir ? `${outDir}/` : "";

	if (options.architecture === false) {
		return { kind: "flat", plan, files: null };
	}

	if (plan.kind === "legacy") {
		return { kind: "legacy", plan, files: null, stale: [], outName: legacyOutName(rel) };
	}

	if (plan.kind === "service") {
		const serviceDir = outDir || (plan.isClient ? "client" : "server");
		return {
			kind: "service",
			plan,
			files: serviceFiles(plan, ast, options, serviceDir),
			stale: [rel.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau")],
		};
	}

	if (plan.kind === "config" || plan.kind === "module") {
		return {
			kind: plan.kind,
			plan,
			files: [{ name: `${prefix}${plan.serviceName}.luau`, contents: emitModule(plan, ast, options) }],
			stale: [rel.replace(/\.(cpp|cc|cxx|c|h|hpp|hh)$/i, ".luau")],
		};
	}

	return { kind: "flat", plan, files: null, stale: [] };
}

module.exports = {
	analyze,
	planOutput,
	toPascalServiceName,
	VALUE_CLASSES,
};
