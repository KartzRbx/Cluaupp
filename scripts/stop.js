const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pidFile = path.join(__dirname, "..", ".rojo.pid");

if (!fs.existsSync(pidFile)) {
	console.log("[stop] Rojo não está rodando (sem .rojo.pid)");
	process.exit(0);
}

const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
if (!Number.isFinite(pid) || pid <= 0) {
	fs.unlinkSync(pidFile);
	console.log("[stop] pid inválido, arquivo removido");
	process.exit(0);
}

console.log(`[stop] parando Rojo (pid ${pid})`);
const result = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
	encoding: "utf8",
});

if (result.status !== 0 && !/not found|não foi encontrado/i.test(`${result.stdout || ""}${result.stderr || ""}`)) {
	console.error(result.stderr || result.stdout || "falha ao parar o Rojo");
	process.exit(result.status ?? 1);
}

if (fs.existsSync(pidFile)) {
	fs.unlinkSync(pidFile);
}
console.log("[stop] Rojo parado");
