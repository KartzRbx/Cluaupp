"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIME_SUITE = void 0;
exports.resolveStudioBinary = resolveStudioBinary;
exports.runStudioSmoke = runStudioSmoke;
/**
 * Optional Studio smoke — skip when Studio is absent.
 * Not a parallel Studio test framework; keep minimal.
 */
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../package-info.js");
function resolveStudioBinary() {
    if (process.env.ROBLOX_STUDIO) {
        return process.env.ROBLOX_STUDIO;
    }
    const candidates = [
        "C:\\\\Program Files (x86)\\\\Roblox\\\\Versions",
        "C:\\\\Program Files\\\\Roblox\\\\Versions",
    ];
    for (const root of candidates) {
        if (!node_fs_1.default.existsSync(root)) {
            continue;
        }
        for (const ver of node_fs_1.default.readdirSync(root)) {
            const exe = node_path_1.default.join(root, ver, "RobloxStudioBeta.exe");
            if (node_fs_1.default.existsSync(exe)) {
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
function runStudioSmoke() {
    const studio = resolveStudioBinary();
    if (!studio) {
        return { skipped: true, ok: true, output: "Roblox Studio not found; smoke skipped" };
    }
    const scriptPath = node_path_1.default.join(package_info_js_1.projectRoot, "test", "studio", "smoke.luau");
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(scriptPath), { recursive: true });
    node_fs_1.default.writeFileSync(scriptPath, SMOKE_SCRIPT, "utf8");
    const result = (0, node_child_process_1.spawnSync)(studio, ["--task", "RunScript", scriptPath], {
        encoding: "utf8",
        timeout: 120_000,
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    const ok = output.includes("SMOKE_OK") || result.status === 0;
    return { skipped: false, ok, output };
}
exports.RUNTIME_SUITE = [
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
];
