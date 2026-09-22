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

const language = require("../generated/flare/language");
const unknown = language.diagnoseFlare("packet Hit(Widget x) from Client\n", "Net.flare");
expect(unknown.some((item) => /unknown type/.test(item.message)), "diagnose unknown type");
const emptyHint = language.diagnoseFlare("\n// none\n", "Net.flare");
expect(emptyHint.some((item) => item.severity === "hint" || /empty/.test(item.message)), "empty schema diagnostic");
const startCompletions = language.completionsAt("", 0, 0);
expect(startCompletions.some((item) => item.label === "packet"), "complete packet at line start");
const typeCompletions = language.completionsAt("packet Hit(", 0, 11);
expect(typeCompletions.some((item) => item.label === "i32"), "complete types inside packet parens");
const sideCompletions = language.completionsAt("packet Hit() from ", 0, 18);
expect(sideCompletions.some((item) => item.label === "Client"), "complete from Client/Server");
const packetHover = language.hoverAt("packet Hit(Player target, i32 damage) from Client\n", 0, 8);
expect(Boolean(packetHover) && packetHover.contents.includes("FireServer"), "hover packet API");
const outline = language.symbolsIn("opt name = Net\npacket Hit() from Client\nquery Session() -> i32\n");
expect(outline.some((item) => item.name === "Hit") && outline.some((item) => item.name === "Session"), "document symbols");

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

const flareRuntime = fs.readFileSync(path.join(__dirname, "../runtime/Flare/init.luau"), "utf8");
expect(flareRuntime.includes("local packedInstances = table.pack(...)"), "Flare packs ... before pcall");
expect(!/pcall\(function\(\)\s*\n\s*local incoming = fromBuffer\(buf, table\.pack\(\.\.\.\)/.test(flareRuntime), "Flare must not capture ... inside pcall");

console.log("Cluaupp flare ok");
console.log(outTree.join("\n"));
