"use strict";

const { compileSource, compileService } = require("../generated/compile");
const { contains, refuses, expect } = require("./helpers");

const pragma = compileSource("#pragma strict\nvoid init() { print(\"ok\"); }\n", "boot.cpp");
expect(pragma.includes("--!strict"), "#pragma strict emits --!strict");

const nstrict = compileSource("#pragma nstrict\nvoid init() { print(\"ok\"); }\n", "boot.cpp", { strict: true });
expect(!nstrict.includes("--!strict"), "#pragma nstrict never emits --!strict");

const plain = compileSource("void init() { print(\"ok\"); }\n", "boot.cpp");
expect(!plain.startsWith("--!strict"), "no --!strict without pragma or config");

const datatypes = compileSource(
	`#include <cluaupp/roblox.hpp>

const int STARTING_COINS = 0;

void init() {
	const auto* players = GetService<Players>();
	auto* part = new Part(workspace);
	part->Size = Vector3(8, 1, 8);
	part->Position = Vector3(0, 10, 0);
	part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
	part->Color = Color3::fromRGB(255, 0, 0);
	part->Anchored = true;
	auto* frame = new Frame();
	frame->Size = UDim2::fromScale(1, 1);
	frame->Position = UDim2(0, 0, 0.5, 0);
	frame->BackgroundColor3 = Color3(1, 1, 1);
	auto material = Enum::Material::Plastic;
	part->Material = material;
}
`,
	"datatypes.cpp",
	{ strict: true },
);
contains(datatypes, [
	"const STARTING_COINS: number = 0",
	'const players: Players = game:GetService("Players")',
	"Vector3.new(8, 1, 8)",
	"CFrame.lookAt",
	"Color3.fromRGB(255, 0, 0)",
	'Instance.new("Part")',
	"part.Parent = workspace",
	"UDim2.fromScale(1, 1)",
	"UDim2.new(0, 0, 0.5, 0)",
	"Enum.Material.Plastic",
], "datatypes / GetService types");

const header = compileSource(
	`#pragma once
#include <cluaupp/roblox.hpp>
const int STARTING_COINS = 25;
void CreateLeaderstats(Player* player);
`,
	"stats.h",
	{ strict: true, relativeName: "stats.h" },
);
contains(header, [
	"export type stats = {",
	"CreateLeaderstats: (player: Player) -> ()",
	"const STARTING_COINS: number = 25",
	"const stats: stats = {",
	"return stats",
], "header export type");
refuses(header, ["const function CreateLeaderstats", "local function CreateLeaderstats", "function stats("], "header must not emit bodies");

const data = compileSource(
	`#include <cluaupp/libs/dataservice.hpp>
struct TemplateData {
	struct Currencies {
		int Money;
		int Level;
	} Currencies;
};
void init() {
	TemplateData playerData = TemplateData {
		.Currencies = { .Money = 0, .Level = 1 },
	};
	DataService::Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData",
		.UseMock = true,
	});
}
`,
	"data.cpp",
	{ strict: true },
);
contains(data, [
	"require(ReplicatedStorage.CluauppLibs.DataService)",
	"Currencies = { Money = 0, Level = 1 }",
	"DataService.Server:Init({",
	'StoreName = "PlayerData"',
], "DataService Init types");

const signal = compileService(
	`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>
void OnCurrenciesChanged() {}
void SetupPlayerManager(Player* player) {
	Data* data = DataService::Server.WaitFor(player);
	data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged);
}
void init() {
	SetupPlayerManager(nullptr);
}
`,
	"server/leaderstats.server.cpp",
	{ strict: true, relativeName: "server/leaderstats.server.cpp" },
);
const luau = signal.files[0].contents;
contains(luau, [
	"const function SetupPlayerManager(player: Player)",
	"GetChangedSignal",
	"Paths.Currencies",
	"type Data = DataService.Data",
], "GetChangedSignal typing");
refuses(luau, ["require(script.Main)", "function DataController.", "-- API", "-- TIPAGENS"], "flat emit must not invent wrappers");

const cout = compileSource(
	`void init() {
	string name = "Money";
	cout << "EnsureStat: " << name << " not found" << endl;
	cerr << "bad";
	cout::print("ok");
	cout::warn("careful");
	cout::error("fail");
	cout::ping("here");
	cout::endl();
}
`,
	"cout.cpp",
	{ strict: true },
);
contains(cout, [
	'print("EnsureStat: ", name, " not found")',
	'warn("bad")',
	'print("ok")',
	'warn("careful")',
	'error("fail")',
	"print()",
], "cout → print/warn/error");
refuses(cout, ["cout.", "endl"], "cout/endl must not leak into Luau");

const sw = compileSource(
	`void Handle(string action, int amount) {
	switch (action) {
	case "buy":
	case "purchase":
		print("bought");
		break;
	case "sell":
		if (amount <= 0) { break; }
		print("sold");
		break;
	default:
		print("unknown");
		break;
	}
}
`,
	"switch.cpp",
	{ strict: true },
);
contains(sw, [
	"repeat",
	"until true",
	'action == "buy" or action == "purchase"',
	'elseif action == "sell" then',
	'print("unknown")',
	"break",
], "switch typing/control");

const casts = compileSource(
	`Folder* AsFolder(Instance* inst) {
	(void)inst;
	return static_cast<Folder*>(inst);
}

void OnPlayer(Player* player) {
	print(player->Name);
}

void init() {
	auto* players = GetService<Players>();
	players->PlayerAdded.Connect([](Player* player) {
		OnPlayer(player);
	});
	players->PlayerAdded.Connect([&](Player* player) {
		OnPlayer(player);
	});
}
`,
	"casts.cpp",
	{ strict: true },
);
contains(casts, [
	"return inst",
	"PlayerAdded:Connect(function(player: Player)",
	"OnPlayer(player)",
], "void cast, static_cast, and Connect lambdas");
refuses(casts, ["(void)", "static_cast"], "casts must not leak into Luau");

const concat = compileSource(
	`string LeaderstatsServer::GetPlayerJanitorKey(Player* player) {
	return (player->Name + "_LeaderstatsJanitor");
}
`,
	"concat.cpp",
	{ strict: true },
);
contains(concat, ['player.Name .. "_LeaderstatsJanitor"'], "string + concatenates with ..");
refuses(concat, ["Name + \""], "string + must not stay arithmetic");

const concatFn = compileSource(
	`string LeaderstatsServer::GetPlayerJanitorKey(Player* player) {
	return string_concat(player->Name, "_", "LeaderstatsJanitor");
}

string emptyJoin() {
	return string_concat();
}

string onePart(string name) {
	return string_concat(name);
}
`,
	"concat-fn.cpp",
	{ strict: true },
);
contains(
	concatFn,
	['(player.Name .. "_" .. "LeaderstatsJanitor")', 'return ""', "return name"],
	"string_concat joins with ..",
);
refuses(concatFn, ["string_concat("], "string_concat must not leak into Luau");

const constexprField = compileSource(
	`struct Wallet {
	static constexpr int STARTING_COINS = 0;
	DataPath Coins;
};
`,
	"wallet.h",
	{ strict: true, relativeName: "wallet.h" },
);
contains(constexprField, ["STARTING_COINS", "Coins"], "static constexpr and DataPath fields");

const playerData = compileSource(
	`#pragma once

struct PlayerDataCurrencies {
	int Coins = 0;
	int Rebirths = 0;
};

struct PlayerDataInventory {
	LuaArray<int> HotBar;
	LuaArray<string> Storage;
	int MaxStorage = 90;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
	PlayerDataInventory Inventory;
};
`,
	"PlayerData.h",
	{ strict: true, relativeName: "shared/PlayerData.h" },
);
contains(
	playerData,
	["HotBar", "Storage", "MaxStorage", "Coins", "Currencies", "Inventory"],
	"LuaArray fields stay on Template structs",
);

console.log("Cluaupp types ok");
