"use strict";

const path = require("path");
const { completeAt, hoverAt, indexProject } = require("../src/intellisense");

const ROOT = path.join(__dirname, "..");

function names(items) {
	return items.map((item) => item.name);
}

function fail(message, extra) {
	console.error("Cluaupp IntelliSense complete test failed:", message);
	if (extra) {
		console.error(extra);
	}
	process.exit(1);
}

const playersSource = `#include <cluaupp/roblox.hpp>

void init() {
	auto* players = GetService<Players>();
	players->
}
`;

const playerOffset = playersSource.indexOf("players->") + "players->".length;
const playerItems = completeAt(playersSource, playerOffset, { projectRoot: ROOT });
if (!names(playerItems).includes("GetPlayers")) {
	fail("Players-> should complete GetPlayers", names(playerItems).slice(0, 30).join(", "));
}
if (!names(playerItems).includes("PlayerAdded")) {
	fail("Players-> should complete PlayerAdded", names(playerItems).slice(0, 30).join(", "));
}

const serviceSource = `#include <cluaupp/roblox.hpp>
void init() {
	auto* players = GetService<
}
`;
const serviceOffset = serviceSource.indexOf("GetService<") + "GetService<".length;
const serviceItems = completeAt(serviceSource, serviceOffset, { projectRoot: ROOT });
if (!names(serviceItems).includes("Players")) {
	fail("GetService< should complete Players", names(serviceItems).slice(0, 30).join(", "));
}

const classSource = `#include <cluaupp/roblox.hpp>
struct ShopService {
	Players* players = GetService<Players>();
	void Buy();
};
void ShopService::Buy() {
	players->
}
`;
const shopOffset = classSource.indexOf("players->") + "players->".length;
const shopItems = completeAt(classSource, shopOffset, { projectRoot: ROOT });
if (!names(shopItems).includes("GetPlayers")) {
	fail("self field players-> should complete GetPlayers", names(shopItems).slice(0, 30).join(", "));
}

const hover = hoverAt(playersSource, playersSource.indexOf("GetService"), { projectRoot: ROOT });
if (!hover || !String(hover.detail || hover.name).includes("GetService")) {
	fail("hover should describe GetService", hover);
}

const index = indexProject(ROOT);
if (!index.types.has("Players") || !index.types.has("Instance")) {
	fail("catalog must index Roblox headers");
}

const janitor = index.types.get("Janitor");
if (!janitor || !janitor.members.has("Add") || !janitor.members.has("Cleanup")) {
	fail("catalog must index Janitor");
}

console.log("Cluaupp IntelliSense complete ok");
