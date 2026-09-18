"use strict";

const fs = require("fs");
const path = require("path");
const { compileSource } = require("../generated/compile");
const { clppLuauToGame } = require("../generated/clpp/postprocess");
const { clppManifest } = require("../generated/clpp/runner");
const { contains, refuses, expect, skipWithoutClpp } = require("./helpers");

skipWithoutClpp();

const hello = compileSource(
	`#include <clpp/roblox.clh>

void Greet(Player* player) {
	post("Player name: " .: player.Name);
}

void init() {
	Players* players = GetService<Players>();
	for (Player* player : players::GetPlayers()) {
		Greet(player);
	}
	players.PlayerAdded::Connect(func (Player* playerEntered) {
		post("New player connected: " .: playerEntered.Name);
	});
}
`,
	"hello.server.clpp",
	{ strict: true },
);

contains(hello, ['game:GetService("Players")', "init()"], "hello GetService + init");
refuses(hello, ["require(ClppLibs."], "hello must not leak ClppLibs");

const rewritten = clppLuauToGame(
	{
		ok: true,
		luau: '-- Compiled by CL++\nconst Janitor = require(ClppLibs.Janitor)\n',
		fileName: "x.server.clpp",
		outputHint: "x.server.luau",
		scriptKind: "server",
		isScript: true,
		isHeader: false,
		rojoClass: "Script",
		libraries: ["Janitor"],
	},
	{ relativeName: "x.server.clpp", outName: "x.server.luau", strict: true },
);
contains(rewritten, ["require(ReplicatedStorage.CluauppLibs.Janitor)"], "postprocess ClppLibs → CluauppLibs");
refuses(rewritten, ["require(ClppLibs."], "postprocess leftover ClppLibs");

const manifest = clppManifest();
expect(manifest.id === "clpp" || manifest.name === "CL++", `manifest ${JSON.stringify(manifest)}`);
expect(Array.isArray(manifest.extensions) && manifest.extensions.some((ext) => String(ext).includes("clpp")), "manifest lists .clpp");

const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "clpp-manifest.json"), "utf8"));
for (const ext of snapshot.extensions) {
	expect(
		(manifest.extensions || []).some((item) => String(item).includes(ext.replace(/^\./, ""))),
		`manifest missing ${ext}`,
	);
}

console.log("Cluaupp clpp contract ok");
