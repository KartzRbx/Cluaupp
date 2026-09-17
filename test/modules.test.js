"use strict";

const { compileSource } = require("../generated/compile");
const { expect, contains, refuses, listOut, readOut, makeGame, buildGame } = require("./helpers");

const libs = compileSource(
	`#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/promise.hpp>
#include <cluaupp/libs/dataservice.hpp>

void OnCoins(Player* player, int amount) { return; }

void init() {
	Janitor* janitor = new Janitor();
	janitor->Add(GetService<Players>()->PlayerAdded.Connect(OnCoins));
	janitor->Cleanup();
	auto* coins = Net::Event("Coins");
	coins->On(OnCoins);
	coins->FireAll(25);
	Promise::delay(1);
	Data* data = DataService::Server.WaitFor(nullptr);
	data->GetChangedSignal(DataService::Server.Paths).Connect(OnCoins);
}
`,
	"libs.cpp",
	{ strict: true },
);
contains(libs, [
	'const ReplicatedStorage = game:GetService("ReplicatedStorage")',
	"const Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)",
	"type Janitor = Janitor.Janitor",
	"const Net = require(ReplicatedStorage.CluauppLibs.Net)",
	"const Promise = require(ReplicatedStorage.CluauppLibs.Promise)",
	"const DataService = require(ReplicatedStorage.CluauppLibs.DataService)",
	"type Data = DataService.Data",
	"Janitor.new()",
	"janitor:Add(",
	'Net.Event("Coins")',
	"DataService.Server:WaitFor",
], "CluauppLibs requires");
refuses(libs, ['WaitForChild("CluauppLibs")'], "libs must use the Rojo CluauppLibs path");

const game = makeGame({
	"src/shared/constants/TemplateData.h": `#pragma once
struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
	int CurrentIsland = 1;
};
`,
	"src/server/configurations/PlayerDataVersion.h": `#pragma once
const int PLAYER_DATA_VERSION = 3;
`,
	"src/server/shop/ShopService.h": `#pragma once
struct ShopService {
	int Stock = 3;
	void Buy(Player* player);
	void init();
};
`,
	"src/server/shop/ShopService.cpp": `#include "ShopService.h"

void ShopService::Buy(Player* player) {
	Stock = Stock - 1;
}

void ShopService::init() {
	Buy(nullptr);
}
`,
	"src/server/boot/DataBoot.server.cpp": `#include <cluaupp/libs/dataservice.hpp>
#include "shared/constants/TemplateData.h"
#include "server/configurations/PlayerDataVersion.h"

void init() {
	TemplateData playerData = TemplateData();
	DataService::Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = PLAYER_DATA_VERSION,
		.UseMock = true,
	});
}
`,
	"src/server/boot/ServicesBoot.server.cpp": `#include "server/shop/ShopService.h"

void init() {
	ShopService::init();
}
`,
});

expect(buildGame(game).failed === 0, "modular game build failed", listOut(game).join("\n"));

const outTree = listOut(game);
for (const name of [
	"shared/constants/TemplateData.luau",
	"server/configurations/PlayerDataVersion.luau",
	"server/shop/ShopService.luau",
	"server/shop/ShopServiceImpl.luau",
	"server/boot/DataBoot.server.luau",
	"server/boot/ServicesBoot.server.luau",
]) {
	expect(outTree.includes(name), `modular out missing ${name}`, outTree.join("\n"));
}

const templateData = readOut(game, "shared/constants/TemplateData.luau");
contains(templateData, [
	"export type TemplateData = {",
	"const function TemplateData(): TemplateData",
	"Money = 0",
	"CurrentIsland = 1",
	"return TemplateData",
], "TemplateData module");

const version = readOut(game, "server/configurations/PlayerDataVersion.luau");
contains(version, ["PLAYER_DATA_VERSION", "return"], "PlayerDataVersion module");

const shopTypes = readOut(game, "server/shop/ShopService.luau");
contains(shopTypes, [
	"export type ShopService = {",
	"Buy: (self: ShopService, player: Player) -> ()",
	"init: (self: ShopService) -> ()",
	"Stock: number",
	"const ShopServiceModule = require(",
	"Buy = ShopServiceModule.Buy",
	"const ShopService: ShopService = {",
], "ShopService header types");
refuses(shopTypes, ["function ShopService:Buy"], "header must not emit method bodies");

const shopImpl = readOut(game, "server/shop/ShopServiceImpl.luau");
contains(shopImpl, [
	"function ShopService:Buy",
	"function ShopService:init",
	"self.Stock",
	"self:Buy",
	"return ShopService",
], "ShopService impl");

const dataBoot = readOut(game, "server/boot/DataBoot.server.luau");
contains(dataBoot, [
	"const TemplateData = require(ReplicatedStorage.Cluaupp.constants.TemplateData)",
	"const PlayerDataVersion = require(ServerScriptService.Cluaupp.configurations.PlayerDataVersion)",
	"const PLAYER_DATA_VERSION = PlayerDataVersion.PLAYER_DATA_VERSION",
	"DataService.Server:Init",
	"init()",
], "DataBoot requires");
refuses(dataBoot, [
	"script.Parent.Parent",
	".shared.constants",
	"local ReplicatedStorage",
	"local function init",
	"require(script.Main)",
	"DataController",
], "DataBoot must use game-rooted const requires");

const servicesBoot = readOut(game, "server/boot/ServicesBoot.server.luau");
contains(servicesBoot, [
	"const ShopService = require(",
	"ShopService:init()",
	"const function init()",
], "ServicesBoot wires ShopService");
refuses(servicesBoot, ["typeof(ShopService())", "local function init"], "ServicesBoot must not treat the module as a constructor");

console.log("Cluaupp modules ok");
console.log(outTree.join("\n"));
