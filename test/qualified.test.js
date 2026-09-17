"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { compileService } = require("../src/compile");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-qual-"));
const srcDir = path.join(dir, "src");
const folder = path.join(srcDir, "server", "shop");
fs.mkdirSync(folder, { recursive: true });

const header = path.join(folder, "ShopService.hpp");
const impl = path.join(folder, "ShopService.cpp");
const boot = path.join(srcDir, "server", "boot", "Start.server.cpp");
fs.mkdirSync(path.dirname(boot), { recursive: true });

fs.writeFileSync(
	header,
	`#pragma once
struct ShopService {
	int Stock = 3;
	void Buy(Player* player);
	void init();
};
`,
	"utf8",
);

fs.writeFileSync(
	impl,
	`#include "ShopService.h"

void ShopService::Buy(Player* player) {
	Stock = Stock - 1;
}

void ShopService::init() {
	Buy(nullptr);
}
`,
	"utf8",
);

fs.writeFileSync(
	boot,
	`#include "../shop/ShopService.h"

void init() {
	ShopService::init();
}
`,
	"utf8",
);

const headerResult = compileService(fs.readFileSync(header, "utf8"), "server/shop/ShopService.hpp", {
	strict: true,
	filePath: header,
	relativeName: "server/shop/ShopService.hpp",
	includeDirs: [folder, srcDir],
	srcDir,
});

const moduleResult = compileService(fs.readFileSync(impl, "utf8"), "server/shop/ShopService.cpp", {
	strict: true,
	filePath: impl,
	relativeName: "server/shop/ShopService.cpp",
	includeDirs: [folder, srcDir],
	srcDir,
});

const bootResult = compileService(fs.readFileSync(boot, "utf8"), "server/boot/Start.server.cpp", {
	strict: true,
	filePath: boot,
	relativeName: "server/boot/Start.server.cpp",
	includeDirs: [path.dirname(boot), srcDir],
	srcDir,
});

const headerFiles = Object.fromEntries(headerResult.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const moduleFiles = Object.fromEntries(moduleResult.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const bootFiles = Object.fromEntries(bootResult.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const types = headerFiles["server/shop/ShopService.luau"] || Object.values(headerFiles)[0];
const shop = moduleFiles["server/shop/ShopServiceImpl.luau"] || Object.values(moduleFiles)[0];
const start = Object.values(bootFiles).find((contents) => contents.includes("ShopService") && contents.includes("function")) || Object.values(bootFiles).join("\n");

const missing = [];
if (!types) {
	missing.push("ShopService header module");
} else {
	if (!types.includes("export type ShopService = {")) {
		missing.push("export type ShopService");
	}
	if (!types.includes("Buy: (self: ShopService, player: Player) -> ()")) {
		missing.push("typed Buy");
	}
	if (!types.includes("init: (self: ShopService) -> ()")) {
		missing.push("typed init");
	}
	if (!types.includes("Stock: number")) {
		missing.push("typed Stock");
	}
	if (!types.includes("const ShopServiceModule = require(")) {
		missing.push("header requires impl");
	}
	if (!types.includes("Buy = ShopServiceModule.Buy")) {
		missing.push("header binds Buy");
	}
	if (!types.includes("const ShopService: ShopService = {")) {
		missing.push("typed header table");
	}
	if (types.includes("function ShopService:Buy")) {
		missing.push("header must not emit method bodies");
	}
}
if (!shop) {
	missing.push("ShopService impl module");
} else {
	if (!shop.includes("Stock")) {
		missing.push("struct field Stock");
	}
	if (!shop.includes("function ShopService:Buy")) {
		missing.push("ShopService:Buy");
	}
	if (!shop.includes("function ShopService:init")) {
		missing.push("ShopService:init");
	}
	if (!shop.includes("self.Stock")) {
		missing.push("self.Stock");
	}
	if (!shop.includes("self:Buy")) {
		missing.push("self:Buy");
	}
	if (!shop.includes("return ShopService")) {
		missing.push("return ShopService");
	}
}
if (!start.includes("ShopService:init")) {
	missing.push("boot calls ShopService:init");
}
if (!start.includes("const ShopService = require(")) {
	missing.push("boot requires ShopService module");
}

if (missing.length) {
	console.error("Cluaupp qualified :: test failed:");
	for (const item of missing) {
		console.error(" -", item);
	}
	console.error("\n--- header ---\n", types);
	console.error("\n--- impl ---\n", shop);
	console.error("\n--- boot files ---\n", Object.keys(bootFiles));
	console.error(start);
	process.exit(1);
}

console.log("Cluaupp qualified :: ok");
