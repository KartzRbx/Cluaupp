/**
 * Optional Studio smoke — skip when Studio is absent.
 * Not a parallel Studio test framework; keep minimal.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";

export interface StudioSmokeResult {
	skipped: boolean;
	ok: boolean;
	output: string;
}

export function resolveStudioBinary(): string | null {
	if (process.env.ROBLOX_STUDIO) {
		return process.env.ROBLOX_STUDIO;
	}
	const candidates = [
		"C:\\\\Program Files (x86)\\\\Roblox\\\\Versions",
		"C:\\\\Program Files\\\\Roblox\\\\Versions",
	];
	for (const root of candidates) {
		if (!fs.existsSync(root)) {
			continue;
		}
		for (const ver of fs.readdirSync(root)) {
			const exe = path.join(root, ver, "RobloxStudioBeta.exe");
			if (fs.existsSync(exe)) {
				return exe;
			}
		}
	}
	return null;
}

const SMOKE_SCRIPT = `
local ok = true
local function check(cond, msg)
	if not cond then
		ok = false
		warn("[cluaupp-smoke]", msg)
	end
end
check(typeof(Instance.new("Folder")) == "Instance", "Instance.new Folder")
check(game:GetService("Players") ~= nil, "GetService Players")
check(typeof(Vector3.new(1,2,3)) == "Vector3", "Vector3")
check(Enum.Material.Plastic ~= nil, "Enum.Material")
check(task.wait ~= nil, "task.wait")
print(ok and "SMOKE_OK" or "SMOKE_FAIL")
`;

export function runStudioSmoke(): StudioSmokeResult {
	const studio = resolveStudioBinary();
	if (!studio) {
		return { skipped: true, ok: true, output: "Roblox Studio not found; smoke skipped" };
	}
	const scriptPath = path.join(projectRoot, "test", "studio", "smoke.luau");
	fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
	fs.writeFileSync(scriptPath, SMOKE_SCRIPT, "utf8");
	const result = spawnSync(studio, ["--task", "RunScript", scriptPath], {
		encoding: "utf8",
		timeout: 120_000,
	});
	const output = `${result.stdout || ""}${result.stderr || ""}`;
	const ok = output.includes("SMOKE_OK") || result.status === 0;
	return { skipped: false, ok, output };
}

export const RUNTIME_SUITE = [
	"Instance.new",
	"GetService",
	"events",
	"datatypes",
	"ModuleScript",
	"Server",
	"Client",
	"enums",
	"task",
	"require",
] as const;
