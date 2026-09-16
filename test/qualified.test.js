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

const moduleResult = compileService(fs.readFileSync(impl, "utf8"), "server/shop/ShopService.cpp", {
	strict: true,
	filePath: impl,
	relativeName: "server/shop/ShopService.cpp",
	includeDirs: [folder, srcDir],
	srcDir,
	architecture: true,
});

const bootResult = compileService(fs.readFileSync(boot, "utf8"), "server/boot/Start.server.cpp", {
	strict: true,
	filePath: boot,
	relativeName: "server/boot/Start.server.cpp",
	includeDirs: [path.dirname(boot), srcDir],
	srcDir,
	architecture: true,
});

const moduleFiles = Object.fromEntries(moduleResult.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const bootFiles = Object.fromEntries(bootResult.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
const shop = moduleFiles["server/shop/ShopService.luau"] || Object.values(moduleFiles)[0];
const start = Object.values(bootFiles).find((contents) => contents.includes("ShopService") && contents.includes("function")) || Object.values(bootFiles).join("\n");

const missing = [];
if (!shop) {
	missing.push("ShopService module");
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
	console.error("\n--- module ---\n", shop);
	console.error("\n--- boot files ---\n", Object.keys(bootFiles));
	console.error(start);
	process.exit(1);
}

console.log("Cluaupp qualified :: ok");
