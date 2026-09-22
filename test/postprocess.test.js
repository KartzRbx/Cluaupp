"use strict";

const { clppLuauToGame } = require("../generated/clpp/postprocess");
const { expect, contains, refuses } = require("./helpers");

const client = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nconst ReplicatedStorage = game:GetService("ReplicatedStorage")\nconst Net = require(script.Parent.Parent.Parent.Parent.ReplicatedStorage.Shared.Net.Net)\n`,
		libraries: [],
	},
	{
		relativeName: "StarterPlayer/StarterPlayerScripts/Controllers/CombatClient.client.clpp",
		outName: "CombatClient.client.luau",
	},
);

contains(client, ['game:GetService("ReplicatedStorage")', "require(ReplicatedStorage.Shared.Net.Net)"], "client Net require");
refuses(client, ["script.Parent.Parent.Parent.Parent.ReplicatedStorage"], "client Parent walk");

const missingService = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nconst Net = require(script.Parent.Parent.ReplicatedStorage.Shared.Net.Net)\n`,
		libraries: [],
	},
	{ relativeName: "x.client.clpp", outName: "x.luau" },
);

contains(missingService, ['game:GetService("ReplicatedStorage")', "require(ReplicatedStorage.Shared.Net.Net)"], "inject GetService");

const roster = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nconst Roster = require(ReplicatedStorage.CluauppLibs.Roster)\nlocal a = Instance.new("Roster")\nlocal b = Roster.New()\n`,
		libraries: ["Roster"],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(roster, ["Roster.new()"], "Roster.new rewrite");
refuses(roster, ['Instance.new("Roster")', "Roster.New()"], "dead Roster constructors");

const libCtors = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nlocal a = Sweep.New()\nlocal b = Spark.New()\nlocal c = Coil.New(1, 8, 0)\nlocal d = Pin.new_(part, gui)\nlocal e = Crest.new_()\nlocal f = Stage.new_(model)\n`,
		libraries: [],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(libCtors, ["Sweep.new()", "Spark.new()", "Coil.new(", "Pin.new(", "Crest.new()", "Stage.new("], "Pascal New / new_ ctors");
refuses(libCtors, ["Sweep.New()", "Spark.New()", "Coil.New(", "Pin.new_(", "Crest.new_()", "Stage.new_("], "dead Pascal New / new_");

const camelColon = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nlist.Push(1)\nlocal n = list.Length()\nlocal id = indexer.Acquire()\nlocal shot = world.Snapshot(1)\npin.SetText("x")\nicon.setName("LB")\nbus.DisconnectAll()\nspring.Step(0.016)\nbuilder.MaxDepth(4)\nbuilder.Display(1)\njob.GetStatus()\n`,
		libraries: [],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(
	camelColon,
	[
		"list:Push(1)",
		"list:Length()",
		"indexer:Acquire()",
		"world:Snapshot(1)",
		"pin:SetText(",
		"icon:setName(",
		"bus:DisconnectAll()",
		"spring:Step(0.016)",
		"builder:MaxDepth(4)",
		"builder:Display(1)",
		"job:GetStatus()",
	],
	"camel method colon",
);
refuses(
	camelColon,
	[
		"list.Push(",
		"builder.MaxDepth(",
		"builder.Display(",
		"job.GetStatus(",
		"bus.DisconnectAll()",
		"spring.Step(",
	],
	"camel method missing self",
);
refuses(camelColon, ["Trace:Display(", "Roster:New("], "static Pascal modules stay dotted");

const hiveTyped = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nconst Hive = require(ReplicatedStorage.CluauppLibs.Hive)\nexport type CombatServer = {\n	World: HiveWorld,\n}\n`,
		libraries: ["Hive"],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(hiveTyped, ["World: Hive.HiveWorld"], "HiveWorld qualifies to Hive.HiveWorld");
refuses(hiveTyped, ["World: HiveWorld,"], "bare HiveWorld type");

const cframeColon = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nhitbox.CFrame = rootPart.CFrame.ToWorldSpace(CFrame.new(0, 0, z))\n`,
		libraries: [],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(cframeColon, ["rootPart.CFrame:ToWorldSpace("], "ToWorldSpace colon");
refuses(cframeColon, ["CFrame.ToWorldSpace("], "ToWorldSpace missing self");

const isStudioColon = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nif not (runService.IsStudio()) then\n\treturn\nend\n`,
		libraries: [],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(isStudioColon, ["runService:IsStudio()"], "IsStudio colon");
refuses(isStudioColon, ["runService.IsStudio()"], "IsStudio missing self");

const templateCtor = clppLuauToGame(
	{
		luau: `-- Compiled by CL++\nconst TemplateData = require(ReplicatedStorage.Shared.Constants.Datas.TemplateData)\nlocal playerData: PlayerTemplate = PlayerTemplate()\n`,
		libraries: [],
	},
	{ relativeName: "x.server.clpp", outName: "x.luau" },
);
contains(templateCtor, ["TemplateData()"], "PlayerTemplate() uses TemplateData require");
refuses(templateCtor, ["= PlayerTemplate()"], "bare PlayerTemplate ctor");

const { formatLuauRoblox } = require("../generated/clpp/format-luau");
const formatted = formatLuauRoblox(`function CombatServer:BindPlayerSessions(): boolean
	local __janitor = Janitor.new()
	__janitor:Add(self.players.PlayerAdded:Connect(function(player: Player)
	self:RegisterFighter(player)
end), "Disconnect")
	return true
end
`);
contains(
	formatted,
	[
		"\t__janitor:Add(self.players.PlayerAdded:Connect(function(player: Player)",
		"\t\tself:RegisterFighter(player)",
		"\tend), \"Disconnect\")",
	],
	"Connect lambda indent",
);

const spaced = formatLuauRoblox(`function CombatServer:CanAcceptAttack(attacker: Player, fighterEntity: number): boolean
	if not (self and attacker and fighterEntity) then
		return false
	end
	local now: number = tick()
	if not lastHit then
		lastHit = 0
	end
	return now - lastHit >= self.ATTACK_INTERVAL
end
`);
contains(
	spaced,
	["\tend\n\n\tlocal now: number = tick()\n\n\tif not lastHit then", "\tend\n\n\treturn now - lastHit >= self.ATTACK_INTERVAL"],
	"blank line between if scopes",
);

const compacted = formatLuauRoblox(`local CombatClient = {}

CombatClient.players = game:GetService("Players")

CombatClient.me = nil

CombatClient.ATTACK_INTERVAL = 0.45

-- CombatClient.client.clpp:6
function CombatClient:IsAttackInput()
end
`);
contains(compacted, ["local CombatClient = {}\nCombatClient.players = game:GetService(\"Players\")\nCombatClient.me = nil\nCombatClient.ATTACK_INTERVAL = 0.45\n\n-- CombatClient.client.clpp:6"], "compact struct field assigns");

const { rewriteSweepJanitor } = require("../generated/clpp/rewrite-janitor");
const hoisted = rewriteSweepJanitor(`function CombatClient:BindCombatInput(): boolean
	local __janitor = Janitor.new()
	if not (self) then
		return false
	end
	__janitor:Add(inputService.InputBegan:Connect(function()
	end), "Disconnect")
	return true
end
`);
contains(hoisted, ["self.janitor", "local __janitor = self.janitor"], "method janitor hoists to self");
refuses(hoisted, ["\tlocal __janitor = Janitor.new()\n\tif not (self)"], "method does not keep orphan Janitor.new");

const linked = rewriteSweepJanitor(`function CombatServer:BindHitboxTouched(hitbox: Part, attacker: Player): boolean
	local __janitor = Janitor.new()
	if not (self and hitbox and attacker) then
		return false
	end
	__janitor:Add(hitbox.Touched:Connect(function(hitPart: BasePart)
	end), "Disconnect")
	return true
end
`);
contains(linked, ["__janitor:LinkToInstance(hitbox)", "local __janitor = Janitor.new()"], "instance bind links Sweep to part");
refuses(linked, ["self.janitor"], "hitbox Sweep is not the controller janitor");

console.log("cluaupp postprocess ReplicatedStorage requires ok");
