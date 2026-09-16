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
	`#include "../../shared/constants/TemplateData.hpp"
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
		architecture: true,
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
if (!templateLuau.includes("const function TemplateData()")) {
	fail("TemplateData should emit a constructor", templateLuau);
}
if (!templateLuau.includes("Money = 0") || !templateLuau.includes("CurrentIsland = 1")) {
	fail("TemplateData constructor should include defaults", templateLuau);
}
if (!templateLuau.includes("return TemplateData")) {
	fail("TemplateData module should return the constructor", templateLuau);
}

const dataBoot = compile("server/boot/DataBoot.server.cpp", path.join(boot, "DataBoot.server.cpp"));
const dataFiles = Object.fromEntries(dataBoot.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const dataController = Object.values(dataFiles).find((contents) => contents.includes("TemplateData") && contents.includes("function")) || "";
if (!dataController.includes("const TemplateData = require(")) {
	fail("DataBoot must require TemplateData", dataController);
}
if (!dataController.includes("const PlayerDataVersion = require(") && !dataController.includes("PLAYER_DATA_VERSION")) {
	fail("DataBoot must require PlayerDataVersion", dataController);
}
if (!dataController.includes("const PLAYER_DATA_VERSION = PlayerDataVersion.PLAYER_DATA_VERSION")) {
	fail("DataBoot must bind PLAYER_DATA_VERSION from the module", dataController);
}
if (dataController.includes("local ReplicatedStorage") || dataController.includes("local DataService = require") || dataController.includes("local function main")) {
	fail("DataBoot must use const requires/functions, not local", dataController);
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
