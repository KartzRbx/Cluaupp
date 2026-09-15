"use strict";

const fs = require("fs");
const path = require("path");

const runtime = path.join(__dirname, "..", "runtime");

function exists(rel) {
	return fs.existsSync(path.join(runtime, rel));
}

function read(rel) {
	return fs.readFileSync(path.join(runtime, rel), "utf8");
}

const missing = [];
function mustExist(rel) {
	if (!exists(rel)) {
		missing.push(`missing ${rel}`);
	}
}

function mustContain(rel, snippet) {
	mustExist(rel);
	if (exists(rel) && !read(rel).includes(snippet)) {
		missing.push(`${rel} missing ${JSON.stringify(snippet)}`);
	}
}

mustExist("Janitor/init.luau");
mustExist("Promise/init.lua");
mustExist("Fusion/init.luau");
mustExist("Fusion/Memory/scoped.luau");
mustExist("Iris/init.lua");
mustExist("Iris/widgets/Window.lua");
mustExist("Cmdr/init.luau");
mustExist("Cmdr/BuiltInCommands/help.luau");
mustExist("TopbarPlus/init.lua");
mustExist("Chrono/init.luau");
mustExist("Chrono/Server/Replicate.luau");
mustExist("DataService/init.luau");
mustExist("DataService/ProfileStore.luau");
mustExist("DataService/Packages/quicknet/QuickNet.luau");
mustExist("EzVisualz/init.luau");
mustExist("EzVisualz/Presets/Rainbow.luau");
mustExist("StateMachine/init.lua");
mustExist("Spring/init.luau");
mustExist("Display/init.luau");
mustExist("Display/option.luau");
mustExist("Module3D/init.luau");
mustExist("FormatNumber/init.lua");
mustExist("FormatNumber/Main/init.lua");
mustExist("Net.luau");
mustExist("MathUtils.luau");
mustExist("Twinkle.luau");
mustExist("StickyBillboard.luau");
mustExist("VfxUtil.luau");
mustExist("SOURCES.md");

mustContain("Janitor/init.luau", "function Janitor.new");
mustContain("Janitor/init.luau", "function Janitor:Add");
mustContain("Janitor/init.luau", "function Janitor:LinkToInstance");
mustContain("Promise/init.lua", "function Promise.prototype:andThen");
mustContain("Promise/init.lua", "Promise.prototype.Then = Promise.prototype.andThen");
mustContain("Fusion/init.luau", "scoped = require(script.Memory.scoped)");
mustContain("Fusion/init.luau", "New = require(script.Instances.New)");
mustContain("Iris/init.lua", "function Iris.Init");
mustContain("Cmdr/CmdrClient/Shared/Registry.luau", "function Registry:RegisterDefaultCommands");
mustContain("TopbarPlus/init.lua", "function Icon:setLabel");
mustContain("Chrono/init.luau", "Start = function");
mustContain("DataService/init.luau", "function DataService.Set");
mustContain("DataService/ProfileStore.luau", "ProfileStore");
mustContain("EzVisualz/init.luau", "function Effect.new");
mustContain("StateMachine/init.lua", "function StateMachine:ChangeState");
mustContain("StateMachine/init.lua", "function StateMachine:GetState()");
mustContain("Spring/init.luau", "function Spring.new");
mustContain("Spring/init.luau", "function Spring:Impulse");
mustContain("Display/init.luau", 'require(script.option)');
mustContain("Module3D/init.luau", "function Module3D.Attach3D");
mustContain("FormatNumber/init.lua", "function FormatNumber.Abbreviate");
mustContain("FormatNumber/Simple/init.lua", '"K"');
mustContain("StickyBillboard.luau", "Instance.new(\"BillboardGui\")");
mustContain("VfxUtil.luau", "function VfxUtil.Emit");
mustContain("VfxUtil.luau", "function VfxUtil.CloneOnto");
mustContain("Net.luau", "buffer");
mustContain("SOURCES.md", "https://github.com/howmanysmall/Janitor");
mustContain("SOURCES.md", "https://github.com/dphfox/Fusion");
mustContain("SOURCES.md", "https://github.com/KartzRbx/dataservicev2");

if (exists("_wally.luau")) {
	missing.push("stale _wally.luau still in runtime/");
}

for (const name of ["Fusion.luau", "Iris.luau", "Cmdr.luau", "DataService.luau", "Janitor.luau"]) {
	if (exists(name)) {
		missing.push(`stale stub ${name} should be a folder, not a file`);
	}
}

if (missing.length > 0) {
	console.error("Cluaupp runtime libs test failed:");
	for (const item of missing) {
		console.error(" -", item);
	}
	process.exit(1);
}

console.log("Cluaupp runtime libs ok");
