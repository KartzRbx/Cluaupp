"use strict";

const path = require("path");
const fs = require("fs");
const { compileNativeSchemaFile } = require("../generated/native/index");
const { expect, contains, refuses, makeGame, buildGame, listOut, readOut, skipWithoutClpp } = require("./helpers");

function throws(fn, snippet, label) {
	let err;
	try {
		fn();
	} catch (caught) {
		err = caught;
	}
	expect(Boolean(err), `${label} should throw`);
	expect(String(err.message).includes(snippet), `${label} message`, err && err.message);
}

function compile(rel, source) {
	const game = makeGame({ [`src/shared/${rel}`]: source });
	const file = path.join(game, "src", "shared", rel);
	return { game, emit: compileNativeSchemaFile(file, path.join(game, "src")) };
}

const mint = compile(
	"Hud.mint",
	`opt name = Hud
formatter Coins compact("K","M","B") fraction 1
`,
);
contains(mint.emit.header, ["string Coins(double value)"], "mint header");
contains(mint.emit.luau, ["--!native", "Mint.Compact"], "mint luau");

const bloom = compile(
	"Fx.bloom",
	`preset Shine gradient 0 #FFC832 1 #FFFFFF speed 0.4
`,
);
contains(bloom.emit.luau, ["--!native", "ColorSequence.new", "Bloom.Play"], "bloom luau");

const bloomBlock = compile(
	"FxBlock.bloom",
	`preset Shine {
gradient 0 #FFC832 1 #FFFFFF speed 0.4
}
`,
);
contains(bloomBlock.emit.luau, ["Bloom.Play", "ColorSequence.new"], "bloom block form");

const codec = fs.readFileSync(path.join(__dirname, "..", "runtime", "Net", "src", "codec.luau"), "utf8");
refuses(codec, ["JSONEncode", "JSONDecode"], "Net codec must not JSON");

const helm = compile(
	"Admin.helm",
	`command Give(Player target, i32 amount) permission Admin
command Kick(Player target, string reason) permission Admin
`,
);
contains(helm.emit.luau, ["--!native", 'Permission = "Admin"', "Id = 1"], "helm luau");
refuses(helm.emit.luau, ["JSONEncode", "HttpService"], "helm must not JSONEncode");

const shift = compile(
	"Npc.shift",
	`state Idle
state Chase parent Combat
Idle -> Chase when SeePlayer
`,
);
contains(shift.emit.luau, ["--!native", "Idle = 0", "Parents", "Chase"], "shift luau");

const hive = compile(
	"World.hive",
	`component Health { i32 current, i32 max }
`,
);
contains(hive.emit.luau, ["--!native", "Health = { Id = 1"], "hive luau");

const axiom = compile(
	"HudMath.axiom",
	`group Scalar
group Lerp
`,
);
contains(axiom.emit.luau, ["--!native", "Axiom.Select", "Scalar"], "axiom luau");

throws(
	() => {
		const game = makeGame({ "src/shared/Empty.mint": "" });
		compileNativeSchemaFile(path.join(game, "src", "shared", "Empty.mint"), path.join(game, "src"));
	},
	"schema is empty",
	"empty mint",
);

skipWithoutClpp();

const game = makeGame({
	"src/shared/Net.flare": `packet Hit(Player target, i32 damage) from Client
packet Announce(string text) from Server
`,
	"src/shared/KeepNet.flare": `packet Ready() from Client
packet Snapshot(buffer payload) from Server
packet Delta(buffer payload) from Server
`,
	"src/shared/Hud.mint": `formatter Coins compact("K","M") fraction 1
`,
	"src/shared/Fx.bloom": `preset Shine gradient 0 #FFC832 1 #FFFFFF
`,
	"src/shared/Admin.helm": `command Give(Player target, i32 amount) permission Admin
`,
	"src/shared/Npc.shift": `state Idle
Idle -> Chase
state Chase
`,
	"src/shared/NpcWorld.hive": `component Health { i32 current, i32 max }
`,
	"src/shared/HudMath.axiom": `group Scalar
`,
	"src/server/boot.server.clpp": `#include <clpp/roblox.clh>
#include "../shared/Net.clh"

void init() {
	Net.Hit~>Connect(func (Player player, Player target, int damage) {
		post(player.Name);
	});
}
`,
});

expect(buildGame(game).failed === 0, "native schema game build failed", listOut(game).join("\n"));
const outTree = listOut(game);
expect(outTree.includes("shared/Net.luau"), "Net.luau", outTree.join("\n"));
expect(outTree.includes("shared/Hud.luau"), "Hud.luau", outTree.join("\n"));
expect(outTree.includes("shared/Fx.luau"), "Fx.luau", outTree.join("\n"));
expect(outTree.includes("shared/Admin.luau"), "Admin.luau", outTree.join("\n"));
expect(outTree.includes("shared/Npc.luau"), "Npc.luau", outTree.join("\n"));
expect(outTree.includes("shared/NpcWorld.luau"), "NpcWorld.luau", outTree.join("\n"));
expect(outTree.includes("shared/HudMath.luau"), "HudMath.luau", outTree.join("\n"));
expect(outTree.includes("shared/KeepNet.luau"), "KeepNet.luau", outTree.join("\n"));

const keepNet = readOut(game, "shared/KeepNet.luau");
contains(keepNet, ["--!native", "Ready", "Snapshot", "Delta"], "KeepNet out");
refuses(keepNet, ["QuickNet", "JSONEncode"], "KeepNet must not mention QuickNet");

const allOut = outTree.map((rel) => readOut(game, rel)).join("\n");
refuses(allOut, ["QuickNet"], "out/ must not vendor QuickNet");

console.log("Cluaupp native schemas ok");
console.log(outTree.join("\n"));
