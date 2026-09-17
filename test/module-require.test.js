"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { compileService } = require("../src/compile");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-modreq-"));
const srcDir = path.join(dir, "src");
const shared = path.join(srcDir, "shared", "constants");
const config = path.join(srcDir, "server", "configurations");
const services = path.join(srcDir, "server", "services", "leaderstats");
const boot = path.join(srcDir, "server", "boot");
for (const folder of [shared, config, services, boot]) {
	fs.mkdirSync(folder, { recursive: true });
}

fs.writeFileSync(
	path.join(shared, "TemplateData.h"),
	`#pragma once
struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
	int CurrentIsland = 1;
};
`,
	"utf8",
);

fs.writeFileSync(
	path.join(config, "PlayerDataVersion.h"),
	`#pragma once
const int PLAYER_DATA_VERSION = 3;
`,
	"utf8",
);

fs.writeFileSync(
	path.join(services, "LeaderstatsServer.h"),
	`#pragma once
struct LeaderstatsServer {
	void init();
};
`,
	"utf8",
);

fs.writeFileSync(
	path.join(services, "LeaderstatsServer.cpp"),
	`#include "LeaderstatsServer.h"
void LeaderstatsServer::init() {}
`,
	"utf8",
);

fs.writeFileSync(
	path.join(boot, "DataBoot.server.cpp"),
	`#include <cluaupp/libs/dataservice.hpp>
#include "../../shared/constants/TemplateData.hpp"
#include "../configurations/PlayerDataVersion.hpp"
int main() {
	TemplateData playerData = TemplateData();
	dataService.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = PLAYER_DATA_VERSION,
		.UseMock = true,
	});
}
`,
	"utf8",
);

fs.writeFileSync(
	path.join(boot, "ServicesBoot.server.cpp"),
	`#include "../services/leaderstats/LeaderstatsServer.h"
void init() {
	LeaderstatsServer::init();
}
`,
	"utf8",
);

function compile(rel, file) {
	return compileService(fs.readFileSync(file, "utf8"), rel, {
		strict: true,
		filePath: file,
		relativeName: rel,
		includeDirs: [path.dirname(file), srcDir],
		srcDir,
	});
}

function fail(message, extra) {
	console.error("Cluaupp module require test failed:", message);
	if (extra) {
		console.error(extra);
	}
	process.exit(1);
}

const template = compile("shared/constants/TemplateData.h", path.join(shared, "TemplateData.h"));
const templateLuau = template.files[0].contents;
if (!templateLuau.includes("export type TemplateData = {")) {
	fail("TemplateData header should export a type", templateLuau);
}
if (!templateLuau.includes("const function TemplateData(): TemplateData")) {
	fail("TemplateData data header should still emit a constructor", templateLuau);
}
if (!templateLuau.includes("Money = 0") || !templateLuau.includes("CurrentIsland = 1")) {
	fail("TemplateData constructor should include defaults", templateLuau);
}
if (!templateLuau.includes("return TemplateData")) {
	fail("TemplateData module should return the constructor", templateLuau);
}

const serviceHeader = compile("server/services/leaderstats/LeaderstatsServer.h", path.join(services, "LeaderstatsServer.h"));
const serviceHeaderLuau = serviceHeader.files[0].contents;
if (!serviceHeaderLuau.includes("export type LeaderstatsServer = {")) {
	fail("service header should export a method type", serviceHeaderLuau);
}
if (!serviceHeaderLuau.includes("init: (self: LeaderstatsServer) -> ()")) {
	fail("service header should type init with self", serviceHeaderLuau);
}
if (!serviceHeaderLuau.includes("const LeaderstatsServerModule = require(")) {
	fail("service header should require the .cpp impl module", serviceHeaderLuau);
}
if (!serviceHeaderLuau.includes("const LeaderstatsServer: LeaderstatsServer = {")) {
	fail("service header should return a table typed as the export", serviceHeaderLuau);
}
if (!serviceHeaderLuau.includes("init = LeaderstatsServerModule.init")) {
	fail("service header should bind init from the impl", serviceHeaderLuau);
}
if (serviceHeaderLuau.includes("function LeaderstatsServer:init") || serviceHeaderLuau.includes("const function LeaderstatsServer")) {
	fail("service header must not construct the implementation", serviceHeaderLuau);
}

const impl = compile("server/services/leaderstats/LeaderstatsServer.cpp", path.join(services, "LeaderstatsServer.cpp"));
const implFiles = Object.fromEntries(impl.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const implLuau = implFiles["server/services/leaderstats/LeaderstatsServerImpl.luau"] || "";
if (!implLuau) {
	fail("sibling .cpp should emit LeaderstatsServerImpl.luau", Object.keys(implFiles).join("\n"));
}
if (!implLuau.includes("function LeaderstatsServer:init")) {
	fail("impl should contain the method body", implLuau);
}

const dataBoot = compile("server/boot/DataBoot.server.cpp", path.join(boot, "DataBoot.server.cpp"));
const dataFiles = Object.fromEntries(dataBoot.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const dataLuau = dataFiles["server/boot/DataBoot.server.luau"] || Object.values(dataFiles)[0] || "";
if (!dataLuau.includes("const TemplateData = require(ReplicatedStorage.Cluaupp.constants.TemplateData)")) {
	fail("DataBoot must require TemplateData from ReplicatedStorage.Cluaupp", dataLuau);
}
if (!dataLuau.includes("const PlayerDataVersion = require(ServerScriptService.Cluaupp.configurations.PlayerDataVersion)")) {
	fail("DataBoot must require PlayerDataVersion from ServerScriptService.Cluaupp", dataLuau);
}
if (dataLuau.includes("script.Parent.Parent") || dataLuau.includes(".shared.constants")) {
	fail("DataBoot must not use script.Parent chains or a fake .shared instance path", dataLuau);
}
if (!dataLuau.includes("const PLAYER_DATA_VERSION = PlayerDataVersion.PLAYER_DATA_VERSION")) {
	fail("DataBoot must bind PLAYER_DATA_VERSION from the module", dataLuau);
}
if (dataLuau.includes("local ReplicatedStorage") || dataLuau.includes("local DataService = require") || dataLuau.includes("local function main")) {
	fail("DataBoot must use const requires/functions, not local", dataLuau);
}
if (dataLuau.includes("require(script.Main)") || dataLuau.includes("DataController") || dataLuau.includes("DataBootTypes")) {
	fail("DataBoot must not invent Main/Controller/Types", dataLuau);
}

const servicesBoot = compile("server/boot/ServicesBoot.server.cpp", path.join(boot, "ServicesBoot.server.cpp"));
const bootFiles = Object.fromEntries(servicesBoot.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const controller = Object.values(bootFiles).find((contents) => contents.includes("LeaderstatsServer") && contents.includes("function")) || "";
if (!controller.includes("const LeaderstatsServer = require(")) {
	fail("ServicesBoot must require LeaderstatsServer", controller + "\n" + Object.keys(bootFiles).join("\n"));
}
if (controller.includes("typeof(LeaderstatsServer())")) {
	fail("class modules must not be typed as a constructor call", controller);
}
if (!controller.includes("LeaderstatsServer:init()") && !controller.includes("LeaderstatsServer.init()")) {
	fail("ServicesBoot must call LeaderstatsServer init", controller);
}
if (controller.includes("local function init")) {
	fail("ServicesBoot must emit const function init", controller);
}

console.log("Cluaupp module require ok");
