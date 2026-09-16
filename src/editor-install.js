"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const { spawnSync } = require("child_process");

const CPPTOOLS_ID = "ms-vscode.cpptools";
const GITHUB_LATEST = "https://api.github.com/repos/microsoft/vscode-cpptools/releases/latest";

function which(command) {
	const finder = process.platform === "win32" ? "where" : "which";
	const result = spawnSync(finder, [command], { encoding: "utf8", windowsHide: true });
	if (result.status !== 0) {
		return null;
	}
	return String(result.stdout || "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line && !line.toLowerCase().includes("info:"));
}

function editorBin() {
	const found = which("cursor") || which("code");
	if (found) {
		return found;
	}
	const local = process.env.LOCALAPPDATA || "";
	const fallbacks = [
		path.join(local, "Programs", "cursor", "resources", "app", "bin", "cursor.cmd"),
		path.join(local, "Programs", "Microsoft VS Code", "bin", "code.cmd"),
		"/usr/bin/cursor",
		"/usr/local/bin/cursor",
		"/usr/bin/code",
		"/usr/local/bin/code",
	];
	return fallbacks.find((file) => fs.existsSync(file)) || null;
}

function extensionHomes() {
	return [
		path.join(os.homedir(), ".cursor", "extensions"),
		path.join(os.homedir(), ".vscode", "extensions"),
	];
}

function isCppToolsInstalled() {
	for (const home of extensionHomes()) {
		if (!fs.existsSync(home)) {
			continue;
		}
		try {
			if (fs.readdirSync(home).some((name) => name.startsWith(CPPTOOLS_ID + "-"))) {
				return true;
			}
		} catch {
			// ignore
		}
	}
	const bin = editorBin();
	if (!bin) {
		return false;
	}
	const listed = spawnSync(bin, ["--list-extensions"], { encoding: "utf8", windowsHide: true, timeout: 20000 });
	return String(listed.stdout || "").split(/\r?\n/).includes(CPPTOOLS_ID);
}

function vsixAssetName(platform = process.platform, arch = process.arch) {
	const cpu = arch === "arm64" ? "arm64" : "x64";
	if (platform === "win32") {
		return `cpptools-windows-${cpu}.vsix`;
	}
	if (platform === "darwin") {
		return `cpptools-macOS-${cpu}.vsix`;
	}
	return `cpptools-linux-${cpu}.vsix`;
}

function httpsJson(url) {
	return new Promise((resolve, reject) => {
		const request = https.get(
			url,
			{ headers: { "User-Agent": "cluaupp", Accept: "application/vnd.github+json" } },
			(response) => {
				if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
					response.resume();
					httpsJson(response.headers.location).then(resolve, reject);
					return;
				}
				const chunks = [];
				response.on("data", (chunk) => chunks.push(chunk));
				response.on("end", () => {
					if (response.statusCode !== 200) {
						reject(new Error("GitHub " + response.statusCode));
						return;
					}
					try {
						resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
					} catch (err) {
						reject(err);
					}
				});
			},
		);
		request.on("error", reject);
	});
}

function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const follow = (current) => {
			https
				.get(current, { headers: { "User-Agent": "cluaupp" } }, (response) => {
					if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
						response.resume();
						follow(response.headers.location);
						return;
					}
					if (response.statusCode !== 200) {
						reject(new Error("download failed " + response.statusCode));
						return;
					}
					const out = fs.createWriteStream(dest);
					response.pipe(out);
					out.on("finish", () => out.close(() => resolve(dest)));
					out.on("error", reject);
				})
				.on("error", reject);
		};
		follow(url);
	});
}

async function downloadCppToolsVsix() {
	const name = vsixAssetName();
	const dest = path.join(os.tmpdir(), name);
	if (fs.existsSync(dest) && fs.statSync(dest).size > 1_000_000) {
		return dest;
	}
	const release = await httpsJson(GITHUB_LATEST);
	const asset = (release.assets || []).find((item) => item.name === name);
	if (!asset || !asset.browser_download_url) {
		throw new Error("no " + name + " in vscode-cpptools " + (release.tag_name || "latest"));
	}
	console.log("cluaupp: downloading", name, release.tag_name || "");
	return downloadFile(asset.browser_download_url, dest);
}

function spawnInstall(bin, target) {
	const result = spawnSync(bin, ["--install-extension", target, "--force"], {
		encoding: "utf8",
		windowsHide: true,
		timeout: 180000,
	});
	return {
		ok: result.status === 0 && !/not found/i.test(String(result.stderr || "") + String(result.stdout || "")),
		stdout: String(result.stdout || ""),
		stderr: String(result.stderr || ""),
		status: result.status,
	};
}

async function installCppTools() {
	if (isCppToolsInstalled()) {
		return { status: "already", id: CPPTOOLS_ID };
	}
	const bin = editorBin();
	if (!bin) {
		return { status: "missing-editor", id: CPPTOOLS_ID };
	}
	console.log("cluaupp: installing", CPPTOOLS_ID);
	const marketplace = spawnInstall(bin, CPPTOOLS_ID);
	if (marketplace.ok) {
		return { status: "installed", id: CPPTOOLS_ID, how: "marketplace" };
	}
	try {
		const vsix = await downloadCppToolsVsix();
		const fromFile = spawnInstall(bin, vsix);
		if (fromFile.ok) {
			return { status: "installed", id: CPPTOOLS_ID, how: "vsix", file: vsix };
		}
		return { status: "failed", id: CPPTOOLS_ID, detail: fromFile.stderr || fromFile.stdout || marketplace.stderr };
	} catch (err) {
		return { status: "failed", id: CPPTOOLS_ID, detail: err.message };
	}
}

function reportCppTools(result) {
	if (!result) {
		return;
	}
	if (result.status === "already") {
		console.log("cluaupp: Microsoft C/C++ already installed");
		return;
	}
	if (result.status === "installed") {
		console.log("cluaupp: installed", CPPTOOLS_ID, result.how === "vsix" ? "(VSIX — Cursor marketplace does not list it)" : "");
		console.log("cluaupp: reload the editor (Ctrl+Shift+P → Developer: Reload Window)");
		return;
	}
	if (result.status === "missing-editor") {
		console.error("cluaupp: Cursor/VS Code CLI not found. Install ms-vscode.cpptools from the VSIX at");
		console.error("  https://github.com/microsoft/vscode-cpptools/releases");
		return;
	}
	console.error("cluaupp: could not install", CPPTOOLS_ID + ":", result.detail || "unknown error");
	console.error("  download https://github.com/microsoft/vscode-cpptools/releases and: cursor --install-extension cpptools-windows-x64.vsix");
}

module.exports = {
	CPPTOOLS_ID,
	editorBin,
	isCppToolsInstalled,
	vsixAssetName,
	installCppTools,
	reportCppTools,
};
