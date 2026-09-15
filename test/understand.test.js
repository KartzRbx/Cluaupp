"use strict";

const { compileService } = require("../src/compile");
const { parseFileTag, analyze } = require("../src/understand");
const { parse } = require("../src/parse");

function expect(cond, message) {
	if (!cond) {
		console.error(message);
		process.exit(1);
	}
}

const server = parseFileTag("src/server/combat.server.cpp");
expect(server.key === "server" && server.rojo === "Script", `server tag ${JSON.stringify(server)}`);

const client = parseFileTag("shop.client.cpp");
expect(client.key === "client" && client.rojo === "LocalScript", `client tag ${JSON.stringify(client)}`);

const legacyS = parseFileTag("boot.legacy.server.cpp");
expect(legacyS.key === "legacy.server" && legacyS.emit === "legacy", `legacy server ${JSON.stringify(legacyS)}`);

const legacyC = parseFileTag("hud.legacy.client.cpp");
expect(legacyC.key === "legacy.client" && legacyC.emit === "legacy", `legacy client ${JSON.stringify(legacyC)}`);

const moduleTag = parseFileTag("shared/damage.cpp");
expect(moduleTag.key === "module" && moduleTag.rojo === "ModuleScript", `module tag ${JSON.stringify(moduleTag)}`);

const combatSrc = `void ApplyDamage(Player* victim, int amount) {
	auto* character = victim->Character;
	if (character == nullptr) {
		return;
	}
	auto* humanoid = character->FindFirstChildOfClass("Humanoid");
	if (humanoid == nullptr) {
		return;
	}
	humanoid->TakeDamage(amount);
}

void init() {
	print("combat ready");
}
`;

const combat = compileService(combatSrc, "server/combat.server.cpp", {
	strict: true,
	relativeName: "server/combat.server.cpp",
});
expect(combat.kind === "service", `combat kind ${combat.kind}`);
const combatFiles = Object.fromEntries(combat.files.map((file) => [file.name.replace(/\\/g, "/"), file.contents]));
expect(!!combatFiles["server/Combat/init.server.luau"], "Combat bootstrap");
expect(!!combatFiles["server/Combat/Main.luau"], "Combat Main");
expect(!!combatFiles["server/Combat/CombatController.luau"], "CombatController from TakeDamage/Humanoid");
expect(!!combatFiles["server/Combat/CombatTypes.luau"], "CombatTypes");
expect(!combatFiles["server/Combat/CacheController.luau"], "combat must not invent CacheController");
expect(!combatFiles["server/Combat/PlayersManager.luau"], "combat must not invent PlayersManager");
expect(combatFiles["server/Combat/CombatController.luau"].includes("TakeDamage"), "user combat logic kept");
expect(combatFiles["server/Combat/CombatController.luau"].includes("function CombatController.Start()"), "Start API");
expect(combatFiles["server/Combat/Main.luau"].includes("CombatController.Start()"), "Main wires domain");
expect(combatFiles["server/Combat/init.server.luau"].includes("require(script.Main):Start()"), "bootstrap");
expect(combat.plan.reasoning.some((line) => line.includes("tag server")), "reasoning records tag");
expect(combat.plan.reasoning.some((line) => line.includes("combat")), "reasoning records combat intent");

const moduleSrc = `int DamageOf(int base) {
	return base;
}
`;
const mod = compileService(moduleSrc, "shared/damage.cpp", {
	strict: true,
	relativeName: "shared/damage.cpp",
});
expect(mod.kind === "module", `module kind ${mod.kind}`);
expect(mod.files[0].name.replace(/\\/g, "/") === "shared/Damage.luau", `module path ${mod.files[0].name}`);
expect(mod.files[0].contents.includes("return {"), "module returns table");
expect(mod.files[0].contents.includes("DamageOf = DamageOf"), "exports DamageOf");
expect(!mod.files[0].contents.includes("\ninit()\n"), "module does not auto-run init");

const legacySrc = `void init() {
	print("legacy boot");
}
`;
const legacy = compileService(legacySrc, "server/boot.legacy.server.cpp", {
	strict: true,
	relativeName: "server/boot.legacy.server.cpp",
});
expect(legacy.kind === "legacy", `legacy kind ${legacy.kind}`);
expect(legacy.files[0].name.replace(/\\/g, "/") === "server/boot.server.luau", `legacy path ${legacy.files[0].name}`);
expect(legacy.files[0].contents.includes("init()"), "legacy still runs init");
expect(!legacy.files[0].name.includes("legacy"), "legacy stripped from Rojo name");

const trivialClient = compileService(
	`void init() {
	print("Cluaupp client ok");
}
`,
	"client/init.client.cpp",
	{ strict: true, relativeName: "client/init.client.cpp" },
);
expect(trivialClient.kind === "flat", `trivial client kind ${trivialClient.kind}`);
expect(trivialClient.files[0].name.replace(/\\/g, "/") === "client/init.client.luau", `trivial path ${trivialClient.files[0].name}`);

const ast = parse(combatSrc, "combat.server.cpp");
const plan = analyze(ast, "server/combat.server.cpp");
expect(plan.roles.domain === "CombatController", `domain ${plan.roles.domain}`);
expect(plan.roles.cache === false, "combat cache false");

console.log("Cluaupp understand tags/intents ok");
console.log(combat.plan.reasoning.join("\n"));
console.log(Object.keys(combatFiles).join("\n"));
