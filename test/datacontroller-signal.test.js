"use strict";

const { compileService } = require("../src/compile");

const source = `#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/dataservice.hpp>

auto* Players = GetService<Players>();
auto* janitor = new Janitor();

void EnsureStat(Instance* leaderstats, string name, int value) {
	auto* existing = leaderstats->FindFirstChild(name);
	if (existing != nullptr) {
		return;
	}
	auto* stat = new IntValue(leaderstats);
	stat->Name = name;
	stat->Value = value;
}

void ApplyCurrencies(Player* player) {
	Data* data = DataService::Server.Get(player);
	if (data == nullptr) {
		return;
	}
	auto* leaderstats = player->FindFirstChild("leaderstats");
	if (leaderstats == nullptr) {
		return;
	}
	auto* money = leaderstats->FindFirstChild("Money");
	if (money != nullptr) {
		money->Value = data->Get(DataService::Server.Paths.Currencies.Money);
	}
}

void OnCurrenciesChanged() {
	for (auto* player : Players->GetPlayers()) {
		ApplyCurrencies(player);
	}
}

void SetupPlayerManager(Player* player) {
	Data* data = DataService::Server.WaitFor(player);
	if (data == nullptr) {
		return;
	}
	auto* leaderstats = player->FindFirstChild("leaderstats");
	if (leaderstats == nullptr) {
		leaderstats = new Folder(player);
		leaderstats->Name = "leaderstats";
	}
	EnsureStat(leaderstats, "Money", 0);
	ApplyCurrencies(player);
	janitor->Add(data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged));
}

void init() {
	for (auto* player : Players->GetPlayers()) {
		SetupPlayerManager(player);
	}
	janitor->Add(Players->PlayerAdded.Connect(SetupPlayerManager));
}

void OnClose() {
	janitor->Destroy();
}
`;

const result = compileService(source, "server/leaderstats.server.cpp", {
	strict: true,
	relativeName: "server/leaderstats.server.cpp",
});

if (result.kind !== "flat") {
	console.error("expected 1:1 flat emit, got", result.kind);
	process.exit(1);
}

const files = Object.fromEntries(result.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const data = files["server/leaderstats.server.luau"];
if (!data) {
	console.error("missing server/leaderstats.server.luau");
	console.error(Object.keys(files));
	process.exit(1);
}

const required = [
	"const function SetupPlayerManager(player: Player)",
	"const function EnsureStat(",
	"GetChangedSignal",
	"Paths.Currencies",
	"SetupPlayerManager(player)",
	"PlayerAdded:Connect(SetupPlayerManager)",
	"init()",
];

const missing = required.filter((piece) => !data.includes(piece));
if (missing.length > 0) {
	console.error("leaderstats missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\n--- luau ---\n" + data);
	process.exit(1);
}

if (/\bSetupPlayerManager\(/.test(data) && !/\bconst function SetupPlayerManager\b/.test(data)) {
	console.error("calls SetupPlayerManager without defining it");
	console.error(data);
	process.exit(1);
}

if (data.includes("-- API") || data.includes("-- TIPAGENS") || data.includes("-- FUNÇÕES")) {
	console.error("must not emit section banners");
	console.error(data);
	process.exit(1);
}

if (data.includes("require(script.Main)") || data.includes("function DataController.")) {
	console.error("must not invent Main/DataController wrappers");
	console.error(data);
	process.exit(1);
}

console.log("Cluaupp DataController GetChangedSignal ok");
