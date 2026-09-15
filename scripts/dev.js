const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const gameDir = path.join(root, "game");
const cluaupp = path.join(root, "bin", "cluaupp.js");
const pidFile = path.join(root, ".rojo.pid");

if (!fs.existsSync(gameDir)) {
	console.error("[dev] pasta game/ não existe. Rode: node bin/cluaupp.js init game");
	process.exit(1);
}

console.log("[dev] Cluaupp build");
const built = spawnSync(process.execPath, [cluaupp, "build", gameDir], {
	cwd: root,
	stdio: "inherit",
});
if (built.status !== 0) {
	process.exit(built.status ?? 1);
}

if (fs.existsSync(pidFile)) {
	const oldPid = Number(fs.readFileSync(pidFile, "utf8").trim());
	if (Number.isFinite(oldPid) && oldPid > 0) {
		spawnSync("taskkill", ["/PID", String(oldPid), "/T", "/F"], { stdio: "ignore" });
	}
	fs.unlinkSync(pidFile);
}

console.log("[dev] rojo serve (plugin no Studio)");
const rojo = spawn("rojo", ["serve"], {
	cwd: gameDir,
	stdio: "inherit",
	shell: true,
	detached: false,
});
fs.writeFileSync(pidFile, String(rojo.pid), "utf8");

rojo.on("exit", (code) => {
	if (fs.existsSync(pidFile)) {
		fs.unlinkSync(pidFile);
	}
	if (code && code !== 0) {
		process.exit(code);
	}
});

console.log("[dev] cluaupp watch — npm run stop para o Rojo");
const watch = spawn(process.execPath, [cluaupp, "watch", gameDir], {
	cwd: root,
	stdio: "inherit",
});
watch.on("exit", (code) => {
	if (code && code !== 0) {
		process.exit(code);
	}
});
