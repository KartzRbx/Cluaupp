"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VENDOR = path.join(ROOT, "vendor");
const RUNTIME = path.join(ROOT, "runtime");

const SKIP_NAMES = new Set([
	".git",
	".github",
	".vscode",
	"__tests__",
	"jest.config.luau",
	"node_modules",
]);

function shouldSkipFile(name) {
	return (
		name.endsWith(".spec.lua") ||
		name.endsWith(".spec.luau") ||
		name === "demoWindow.lua"
	);
}

function copyTree(from, to, options = {}) {
	const extraSkip = new Set(options.skip || []);
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		if (SKIP_NAMES.has(entry.name) || extraSkip.has(entry.name)) {
			continue;
		}
		if (shouldSkipFile(entry.name)) {
			continue;
		}
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyTree(src, dest, options);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

function copyLicense(fromDir, toDir) {
	for (const name of ["LICENSE", "LICENSE.md", "LICENSE.txt", "license"]) {
		const src = path.join(fromDir, name);
		if (fs.existsSync(src)) {
			fs.copyFileSync(src, path.join(toDir, name === "license" ? "LICENSE" : name));
			return;
		}
	}
}

function write(file, contents) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, contents.replace(/\r\n/g, "\n"), "utf8");
}

function read(file) {
	return fs.readFileSync(file, "utf8");
}

function rmIfFile(file) {
	if (fs.existsSync(file) && fs.statSync(file).isFile()) {
		fs.unlinkSync(file);
	}
}

function rmDir(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

const KEEP_FILES = new Set([
	"Net.luau",
	"MathUtils.luau",
	"Twinkle.luau",
	"ArrayIndexer.luau",
	"Occlude.luau",
	"StickyBillboard.luau",
	"VfxUtil.luau",
	"SOURCES.md",
]);

function clearReplacedRuntime() {
	for (const entry of fs.readdirSync(RUNTIME, { withFileTypes: true })) {
		if (KEEP_FILES.has(entry.name)) {
			continue;
		}
		const full = path.join(RUNTIME, entry.name);
		if (entry.isDirectory()) {
			rmDir(full);
		} else if (entry.name.endsWith(".luau") || entry.name.endsWith(".lua") || entry.name === "_wally.luau") {
			fs.unlinkSync(full);
		}
	}
}

function vendorPackage({ destName, sourceDir, repoDir, skip }) {
	const dest = path.join(RUNTIME, destName);
	rmDir(dest);
	copyTree(sourceDir, dest, { skip });
	if (repoDir) {
		copyLicense(repoDir, dest);
	}
	return dest;
}

function patchFile(file, transform) {
	if (!fs.existsSync(file)) {
		throw new Error(`missing ${file}`);
	}
	const next = transform(read(file));
	write(file, next);
}

clearReplacedRuntime();

vendorPackage({
	destName: "Janitor",
	sourceDir: path.join(VENDOR, "Janitor", "src"),
	repoDir: path.join(VENDOR, "Janitor"),
	skip: ["__tests__", "jest.config.luau"],
});

vendorPackage({
	destName: "Promise",
	sourceDir: path.join(VENDOR, "Promise", "lib"),
	repoDir: path.join(VENDOR, "Promise"),
	skip: ["init.spec.lua"],
});
patchFile(path.join(RUNTIME, "Promise", "init.lua"), (text) => {
	if (text.includes("Promise.prototype.Then = Promise.prototype.andThen")) {
		return text;
	}
	return text.replace(
		/\nreturn Promise\s*$/,
		`

-- Cluaupp C++ surface: Then / Catch / Await / Cancel
Promise.prototype.Then = Promise.prototype.andThen
Promise.prototype.Catch = Promise.prototype.catch
Promise.prototype.Finally = Promise.prototype.finally
Promise.prototype.Await = Promise.prototype.await
Promise.prototype.Cancel = Promise.prototype.cancel

return Promise
`,
	);
});

vendorPackage({
	destName: "Fusion",
	sourceDir: path.join(VENDOR, "Fusion", "src"),
	repoDir: path.join(VENDOR, "Fusion"),
});

vendorPackage({
	destName: "Iris",
	sourceDir: path.join(VENDOR, "Iris", "lib"),
	repoDir: path.join(VENDOR, "Iris"),
});

vendorPackage({
	destName: "Cmdr",
	sourceDir: path.join(VENDOR, "Cmdr", "Cmdr"),
	repoDir: path.join(VENDOR, "Cmdr"),
});

vendorPackage({
	destName: "TopbarPlus",
	sourceDir: path.join(VENDOR, "TopbarPlus", "src"),
	repoDir: path.join(VENDOR, "TopbarPlus"),
});

vendorPackage({
	destName: "Chrono",
	sourceDir: path.join(VENDOR, "Chrono", "src"),
	repoDir: path.join(VENDOR, "Chrono"),
});

vendorPackage({
	destName: "DataService",
	sourceDir: path.join(VENDOR, "dataservicev2", "src"),
	repoDir: path.join(VENDOR, "dataservicev2"),
});
patchFile(path.join(RUNTIME, "DataService", "init.luau"), (text) => {
	if (text.includes("Cluaupp C++ surface")) {
		return text;
	}
	return text.replace(
		/\nreturn DataService\s*$/,
		`

local function sessionOf(player: Player?)
	if RunService:IsServer() then
		if player == nil then
			return nil
		end
		return DataService.Server:Get(player)
	end
	return DataService.Client:Get()
end

-- Cluaupp C++ surface: DataService::Get(player, path)
function DataService.Get(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:Get(path)
end

function DataService.GetPersisted(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetPersisted(path)
end

function DataService.Set(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:Set(path, value)
	end
end

function DataService.SetTransient(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:SetTransient(path, value)
	end
end

function DataService.UpdateTransient(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:UpdateTransient(path, function()
			return value
		end)
	end
end

function DataService.ClearTransient(player: Player, path: any)
	local data = sessionOf(player)
	if data then
		data:ClearTransient(path)
	end
end

function DataService.GetOrderedList(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetOrderedList(path, {})
end

function DataService.GetOrderedListWithPriority(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetOrderedListWithPriority(path, "Priority")
end

function DataService.WaitFor(player: Player): any
	if RunService:IsServer() then
		return DataService.Server:WaitFor(player)
	end
	return DataService.Client:WaitForData()
end

function DataService.Observe(player: Player, path: any, callback: (...any) -> ()): RBXScriptConnection
	local data = DataService.WaitFor(player)
	return data:GetChangedSignal(path):Connect(callback)
end

return DataService
`,
	);
});

vendorPackage({
	destName: "EzVisualz",
	sourceDir: path.join(VENDOR, "ezVisualz", "lib", "EasyVisuals"),
	repoDir: path.join(VENDOR, "ezVisualz"),
});
patchFile(path.join(RUNTIME, "EzVisualz", "init.luau"), (text) => {
	if (text.includes("function Effect:Play()")) {
		return text;
	}
	return text.replace(
		"return Effect;",
		`function Effect:Play()
	self:Resume();
end

function Effect:Stop()
	self:Pause();
end

return Effect;`,
	);
});

vendorPackage({
	destName: "StateMachine",
	sourceDir: path.join(VENDOR, "RobloxStateMachine", "src", "StateMachine"),
	repoDir: path.join(VENDOR, "RobloxStateMachine"),
});
patchFile(path.join(RUNTIME, "StateMachine", "init.lua"), (text) => {
	if (text.includes("function StateMachine:GetState()")) {
		return text;
	}
	return text.replace(
		"return setmetatable(StateMachine, {",
		`function StateMachine:GetState(): string
    return self:GetCurrentState()
end

return setmetatable(StateMachine, {`,
	);
});

vendorPackage({
	destName: "Spring",
	sourceDir: path.join(VENDOR, "spring", "src"),
	repoDir: path.join(VENDOR, "spring"),
});
patchFile(path.join(RUNTIME, "Spring", "init.luau"), (text) => {
	if (text.includes("function Spring:Impulse")) {
		return text;
	}
	return text.replace(
		/\nreturn Spring\s*$/,
		`

function Spring:Impulse(velocity: number)
	self.Velocity += velocity
	return nil
end

function Spring:SetGoal(target: number)
	self:Set(target)
	return nil
end

function Spring:Update(dt: number): number
	self:Step(dt)
	return self.Position
end

return Spring
`,
	);
});

const displayDest = vendorPackage({
	destName: "Display",
	sourceDir: path.join(VENDOR, "display", "src"),
	repoDir: path.join(VENDOR, "display"),
});
fs.copyFileSync(path.join(VENDOR, "option", "src", "init.luau"), path.join(displayDest, "option.luau"));
copyLicense(path.join(VENDOR, "option"), displayDest);
patchFile(path.join(displayDest, "init.luau"), (text) =>
	text.replace('require("@pkg/@nightcycle/option")', "require(script.option)"),
);

vendorPackage({
	destName: "Module3D",
	sourceDir: path.join(VENDOR, "Module3D", "src"),
	repoDir: path.join(VENDOR, "Module3D"),
});

vendorPackage({
	destName: "FormatNumber",
	sourceDir: path.join(VENDOR, "FormatNumber", "src"),
	repoDir: path.join(VENDOR, "FormatNumber"),
	skip: ["Test"],
});
patchFile(path.join(RUNTIME, "FormatNumber", "Simple", "init.lua"), (text) =>
	text.replace(/local COMPACT_SUFFIX = \{[\s\S]*?\}/, `local COMPACT_SUFFIX = {
	"K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
}`),
);
patchFile(path.join(RUNTIME, "FormatNumber", "init.lua"), (text) => {
	text = text.replace(/\nFormatNumber\.Test = require\(script\.Test\)\s*/g, "\n");
	if (text.includes("function FormatNumber.Abbreviate")) {
		return text;
	}
	return text.replace(
		"return table.freeze(FormatNumber)",
		`function FormatNumber.Abbreviate(value: number, digits: number?): string
	return FormatNumber.Simple.FormatCompact(value)
end

function FormatNumber.Comma(value: number): string
	return FormatNumber.Simple.Format(value, "group-on")
end

function FormatNumber.Compact(value: number): string
	return FormatNumber.Simple.FormatCompact(value)
end

return FormatNumber`,
	);
});

write(
	path.join(RUNTIME, "SOURCES.md"),
	`# CluauppLibs sources

Vendored from GitHub by \`node scripts/vendor-libs.js\`. Licenses stay next to each module.

| Module | Repository |
| --- | --- |
| Janitor | https://github.com/howmanysmall/Janitor |
| Promise | https://github.com/evaera/roblox-lua-promise |
| Fusion | https://github.com/dphfox/Fusion |
| Iris | https://github.com/SirMallard/Iris |
| Cmdr | https://github.com/evaera/Cmdr |
| TopbarPlus | https://github.com/1ForeverHD/TopbarPlus |
| Chrono | https://github.com/Parihsz/Chrono |
| DataService | https://github.com/KartzRbx/dataservicev2 |
| EzVisualz | https://github.com/arxkdev/ezVisualz |
| StateMachine | https://github.com/Prooheckcp/RobloxStateMachine |
| Spring | https://github.com/nightcycle/spring |
| Display | https://github.com/nightcycle/display (+ https://github.com/nightcycle/option) |
| Module3D | https://github.com/TheNexusAvenger/Module3D |
| FormatNumber | https://github.com/Blockzez/RobloxFormatNumber |

Cluaupp originals (no public repo, or the system is Cluaupp’s): **Net**, **MathUtils**, **Twinkle**, **StickyBillboard**, **VfxUtil**, **ArrayIndexer**, **Occlude**.
`,
);

console.log("vendored libraries into runtime/");
for (const entry of fs.readdirSync(RUNTIME).sort()) {
	const full = path.join(RUNTIME, entry);
	const kind = fs.statSync(full).isDirectory() ? "dir" : "file";
	console.log(`  ${kind} ${entry}`);
}
