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
`;

const result = compileService(source, "server/leaderstats.server.cpp", {
	strict: true,
	relativeName: "server/leaderstats.server.cpp",
});

if (result.kind !== "service") {
	console.error("expected service, got", result.kind);
	process.exit(1);
}

const files = Object.fromEntries(result.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const data = files["server/LeaderStats/DataController.luau"];
if (!data) {
	console.error("missing DataController");
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
];

const missing = required.filter((piece) => !data.includes(piece));
if (missing.length > 0) {
	console.error("DataController missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\n--- DataController ---\n" + data);
	process.exit(1);
}

if (/\bSetupPlayerManager\(/.test(data) && !/\bconst function SetupPlayerManager\b/.test(data)) {
	console.error("DataController calls SetupPlayerManager without defining it");
	console.error(data);
	process.exit(1);
}

console.log("Cluaupp DataController GetChangedSignal ok");
