"use strict";

const { compileSource } = require("../src/compile");

const source = `#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/math.hpp>
#include <cluaupp/libs/formatnumber.hpp>
#include <cluaupp/libs/module3d.hpp>
#include <cluaupp/libs/promise.hpp>
#include <cluaupp/libs/twinkle.hpp>

void OnCoins(Player* player, int amount) {
	return;
}

void init() {
	Janitor* janitor = new Janitor();
	janitor->Add(GetService<Players>()->PlayerAdded.Connect(OnCoins));
	janitor->Cleanup();
	auto* coins = Net::Event("Coins");
	coins->On(OnCoins);
	coins->FireAll(25);
	double t = MathUtils::Lerp(0, 1, 0.5);
	print(FormatNumber::Abbreviate(1500));
	Promise::delay(1);
	Module3D::Attach3D(nullptr, nullptr);
	Twinkle::Fade(nullptr, true);
}
`;

const luau = compileSource(source, "libs.cpp", { strict: true });
const checks = [
	'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
	"local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)",
	"type Janitor = Janitor.Janitor",
	"local Net = require(ReplicatedStorage.CluauppLibs.Net)",
	"type Net = Net.Net",
	"local MathUtils = require(ReplicatedStorage.CluauppLibs.MathUtils)",
	"local FormatNumber = require(ReplicatedStorage.CluauppLibs.FormatNumber)",
	"local Module3D = require(ReplicatedStorage.CluauppLibs.Module3D)",
	"local Promise = require(ReplicatedStorage.CluauppLibs.Promise)",
	"type Promise = Promise.Promise",
	"local Twinkle = require(ReplicatedStorage.CluauppLibs.Twinkle)",
	"Janitor.new()",
	"janitor:Add(",
	"janitor:Cleanup()",
	'Net.Event("Coins")',
	"coins:On(OnCoins)",
	"coins:FireAll(25)",
	"MathUtils.Lerp(0, 1, 0.5)",
	"FormatNumber.Abbreviate(1500)",
	"Promise.delay(1)",
	"Module3D:Attach3D(nil, nil)",
	"Twinkle.Fade(nil, true)",
];

const missing = checks.filter((piece) => !luau.includes(piece));
if (missing.length > 0) {
	console.error("Cluaupp libs test failed. Missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\nOutput:\n" + luau);
	process.exit(1);
}

console.log("Cluaupp libs ok");
console.log(luau);
