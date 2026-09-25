"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const dm = require(path.join(__dirname, "..", "generated", "target", "datamodel.js"));
const check = require(path.join(__dirname, "..", "generated", "target", "datamodel-check.js"));
const gen = require(path.join(__dirname, "..", "generated", "target", "datamodel-generate.js"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cluaupp-dm-"));
const projectJson = {
	name: "dm-fixture",
	tree: {
		$className: "DataModel",
		ReplicatedStorage: {
			$className: "ReplicatedStorage",
			Assets: {
				$className: "Folder",
				UI: {
					$className: "Folder",
					Main: {
						$className: "Folder",
						PlayButton: { $className: "TextButton" },
					},
				},
			},
			Shared: {
				$path: "Src/Include",
			},
		},
		ServerScriptService: {
			$className: "ServerScriptService",
			$path: "Src/Server",
		},
	},
};
fs.writeFileSync(path.join(tmp, "default.project.json"), JSON.stringify(projectJson, null, "\t"));
fs.mkdirSync(path.join(tmp, "Src", "Include", "Net"), { recursive: true });
fs.writeFileSync(path.join(tmp, "Src", "Include", "Net", "Net.flare"), "packet X(from Client) {}\n");
fs.mkdirSync(path.join(tmp, "Src", "Server", "Boot"), { recursive: true });
fs.writeFileSync(path.join(tmp, "Src", "Server", "Boot", "DataBoot.server.clpp"), "void init() {}\n");

const profile = dm.buildDatamodelProfile(tmp);
assert.ok(profile);
assert.strictEqual(profile.root.className, "DataModel");
assert.ok(profile.byPath["ReplicatedStorage.Assets.UI.Main.PlayButton"]);
assert.strictEqual(profile.byPath["ReplicatedStorage.Assets.UI.Main.PlayButton"].className, "TextButton");
assert.ok(profile.byPath["ReplicatedStorage.Shared"]);
assert.ok(profile.byPath["ServerScriptService.Boot"] || profile.byPath["ServerScriptService.Boot.DataBoot"]);

const okSource = `void init() {
	auto btn = GetService<ReplicatedStorage>().WaitForChild("Assets").WaitForChild("UI").WaitForChild("Main").WaitForChild("PlayButton");
}
`;
assert.strictEqual(check.checkDatamodelPaths(okSource, profile).length, 0);

const varRootOk = `void init() {
	auto assets = GetService<ReplicatedStorage>().WaitForChild("Assets");
	auto btn = assets.WaitForChild("UI").WaitForChild("Main").WaitForChild("PlayButton");
}
`;
assert.strictEqual(check.checkDatamodelPaths(varRootOk, profile).length, 0, "variable-root WaitForChild should resolve");

const varRootBad = `void init() {
	auto assets = GetService<ReplicatedStorage>().WaitForChild("Assets");
	auto btn = assets.WaitForChild("MissingFolder");
}
`;
assert.ok(
	check.checkDatamodelPaths(varRootBad, profile).some((v) => v.code === "CLUAU_DM_MISSING_CHILD"),
	"variable-root missing child",
);

const badSource = `void init() {
	auto btn = GetService<ReplicatedStorage>().WaitForChild("Assets").WaitForChild("UI").WaitForChild("Main").WaitForChild("FakeButton");
}
`;
const bad = check.checkDatamodelPaths(badSource, profile);
assert.ok(bad.some((v) => v.code === "CLUAU_DM_MISSING_CHILD" && /FakeButton/.test(v.message)));

let threw = false;
try {
	check.assertDatamodelSafe(badSource, profile);
} catch {
	threw = true;
}
assert.ok(threw);

const written = gen.writeDatamodelArtifacts(tmp);
assert.ok(written);
assert.ok(fs.existsSync(written.profilePath));
assert.ok(fs.existsSync(written.headerPath));
const header = fs.readFileSync(written.headerPath, "utf8");
assert.ok(header.includes("PlayButton") || header.includes("TextButton"));
assert.ok(header.includes("struct Dm_DataModel"));

fs.rmSync(tmp, { recursive: true, force: true });
console.log("datamodel ok");
