"use strict";

const fs = require("fs");
const path = require("path");
const { parseFlare, emitFlare } = require("../generated/flare/index");
const { expect, contains, refuses, makeGame, buildGame, listOut, readOut, skipWithoutClpp } = require("./helpers");

const schema = parseFlare(
	`
packet Hit(Player target, i32 damage) from Client
packet Announce(string text) from Server
packet Spark(Vector3 pos) from Server unreliable
query GetCoins() -> i32
query Buy(string itemId, i32 count) -> bool
`,
	"src/shared/Net.flare",
	"Net",
);

expect(schema.packets.length === 3, "three packets");
expect(schema.queries.length === 2, "two queries");
expect(schema.packets[0].name === "Hit" && schema.packets[0].from === "Client", "Hit from Client");
expect(schema.packets[1].reliable === true, "Announce reliable");
expect(schema.packets[2].reliable === false, "Spark unreliable");
expect(schema.queries[0].returns === "i32", "GetCoins i32");

let emptyErr;
try {
	parseFlare("   \n// none\n", "src/shared/Net.flare", "Net");
} catch (err) {
	emptyErr = err;
}
expect(Boolean(emptyErr) && String(emptyErr.message).includes("schema is empty"), "empty schema errors");

let typeErr;
try {
	parseFlare("packet Hit(Widget x) from Client\n", "src/shared/Net.flare", "Net");
} catch (err) {
	typeErr = err;
}
expect(Boolean(typeErr) && String(typeErr.message).includes("unknown type"), "unknown type errors");

const emitted = emitFlare(schema, "shared");
contains(emitted.header, ["cluaupp generated", "struct NetHit", "void FireServer(Player target, int damage)", "struct Net {"], "generated header");
contains(emitted.luau, ["--!native", "Flare.open(script)", "writeHit", "readHit", "session.packet", "session.query", "CluauppLibs.Flare"], "generated luau");
refuses(emitted.luau, ["RemoteEvent.new", "Instance.new(\"RemoteEvent\")"], "generated luau must not assemble remotes");

skipWithoutClpp();

const game = makeGame({
	"src/shared/Net.flare": `packet Hit(Player target, i32 damage) from Client
query GetCoins() -> i32
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

expect(buildGame(game).failed === 0, "flare game build failed", listOut(game).join("\n"));
const outTree = listOut(game);
expect(outTree.includes("shared/Net.luau"), "Net.luau out", outTree.join("\n"));
expect(fs.existsSync(path.join(game, "src/shared/Net.clh")), "generated Net.clh in src");
const netLuau = readOut(game, "shared/Net.luau");
contains(netLuau, ["writeHit", "GetCoins", "Flare.open"], "out Net.luau body");

console.log("Cluaupp flare ok");
console.log(outTree.join("\n"));
