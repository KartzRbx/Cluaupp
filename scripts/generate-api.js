"use strict";

/**
 * Legacy entry — delegates to the TypeScript Roblox Target registry generator.
 * Prefer: `npx tsx src/cli.ts api generate` or `node generated/cli.js api generate`
 * after `npm run build`.
 */
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const cliJs = path.join(root, "generated", "cli.js");
const fs = require("fs");

if (!fs.existsSync(cliJs)) {
	const build = spawnSync("npx", ["tsc"], { cwd: root, stdio: "inherit", shell: true });
	if (build.status !== 0) {
		process.exit(build.status || 1);
	}
}

const result = spawnSync(process.execPath, [cliJs, "api", "generate"], {
	cwd: root,
	stdio: "inherit",
});
process.exit(result.status || 0);
