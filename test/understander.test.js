"use strict";

const { expect } = require("./helpers");
const {
	INTENTS,
	parseFileTag,
	namesIn,
	scoreIntents,
	determineArchitecture,
} = require("../generated/system-understander");

const server = parseFileTag("src/server/combat.server.cpp");
expect(server.key === "server" && server.rojo === "Script" && server.runContext === "Server", "server tag");

const client = parseFileTag("hud.client.cpp");
expect(client.key === "client" && client.rojo === "LocalScript" && client.runtime === "client", "client tag");

const plugin = parseFileTag("tools.plugin.cpp");
expect(plugin.key === "plugin" && plugin.runContext === "Plugin", "plugin tag");

const moduleTag = parseFileTag("src/shared/damage.cpp");
expect(moduleTag.key === "module" && moduleTag.rojo === "ModuleScript", "module tag");

const named = namesIn({
	type: "program",
	body: [
		{ type: "ident", name: "TakeDamage" },
		{ type: "ident", name: "Humanoid" },
		{ type: "ident", name: "PlayerAdded" },
		{ type: "getService", service: "Players" },
		{ type: "new", className: "ScreenGui" },
	],
});
expect(named.has("TakeDamage") && named.has("Players") && named.has("ScreenGui"), "namesIn tokens");

const combatAst = {
	type: "program",
	body: [
		{ type: "ident", name: "TakeDamage" },
		{ type: "ident", name: "Humanoid" },
		{ type: "ident", name: "PlayerAdded" },
		{ type: "getService", service: "Players" },
		{ type: "string", value: "Humanoid" },
	],
};
const combat = determineArchitecture("combat.server.cpp", combatAst);
expect(combat.role === "controller", `combat role ${combat.role}`);
expect(combat.suggestedModule === "CombatController", `combat module ${combat.suggestedModule}`);
expect(combat.fileTag.rojo === "Script", "combat stays a Script");
expect(combat.injectedServices.includes("Players"), "combat injects Players");
expect(!combat.isUtility, "combat is not a utility");

const hudAst = {
	type: "program",
	body: [
		{ type: "getService", service: "Players" },
		{ type: "string", value: "PlayerGui" },
		{ type: "new", className: "ScreenGui" },
		{ type: "new", className: "TextLabel" },
	],
};
const hud = determineArchitecture("hud.client.cpp", hudAst);
expect(hud.role === "controller" && hud.suggestedModule === "ViewController", `hud ${hud.role} ${hud.suggestedModule}`);
expect(hud.fileTag.rojo === "LocalScript", "hud stays a LocalScript");

const util = determineArchitecture("math.cpp", {
	type: "program",
	body: [{ type: "ident", name: "Add" }],
});
expect(util.isUtility && util.role === "utility", "bare math is a utility ModuleScript");
expect(util.suggestedModule === "MathUtil", `util name ${util.suggestedModule}`);
expect(util.fileTag.rojo === "ModuleScript", "utility keeps ModuleScript");

const scored = scoreIntents(new Set(["UserInputService", "InputBegan", "Players"]), "client");
expect(scored[0] && scored[0].name === "input", `client input should dominate, got ${scored[0] && scored[0].name}`);
expect(INTENTS.ui.module === "ViewController", "ui intent");

console.log("Cluaupp SystemUnderstander ok");
