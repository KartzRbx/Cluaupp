"use strict";

const { compileSource } = require("../src/compile");

const source = `#include <cluaupp/libs/dataservice.hpp>

struct TemplateData {
	struct Currencies {
		int Money;
		int Level;
	} Currencies;
};

void init() {
	TemplateData playerData = TemplateData {
		.Currencies = {
			.Money = 0,
			.Level = 1,
		},
	};
	DataService::Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData",
		.UseMock = true,
	});
}
`;

const luau = compileSource(source, "data.cpp", { strict: true });
const checks = [
	"require(ReplicatedStorage.CluauppLibs.DataService)",
	"Currencies = { Money = 0, Level = 1 }",
	'StoreName = "PlayerData"',
	"UseMock = true",
	"Template = playerData",
	"DataService.Server:Init({",
];

const missing = checks.filter((piece) => !luau.includes(piece));
if (missing.length > 0) {
	console.error("Cluaupp DataService initlist test failed. Missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\nOutput:\n" + luau);
	process.exit(1);
}

console.log("Cluaupp DataService initlist ok");
