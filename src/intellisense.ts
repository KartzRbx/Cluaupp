import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pkg, projectRoot as PACKAGE_ROOT } from "./package-info.js";
import type { ProjectConfig } from "./types.js";
import { CLPP_INSTALL_HINT } from "./clpp/contract.js";
import { hasClpp } from "./clpp/runner.js";
import { isSourceFile } from "./clpp/paths.js";
import { editorBin } from "./editor-install.js";

export type CluauppDiagnostic = {
	line: number;
	col: number;
	message: string;
	severity: "error";
};

function copyDir(from: string, to: string): void {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyDir(src, dest);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

function uniqueStrings(...lists: unknown[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const list of lists) {
		if (!Array.isArray(list)) {
			continue;
		}
		for (const item of list) {
			if (typeof item === "string" && item && !seen.has(item)) {
				seen.add(item);
				out.push(item);
			}
		}
	}
	return out;
}

function readJsonObject(file: string): Record<string, unknown> {
	if (!fs.existsSync(file)) {
		return {};
	}
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
	} catch {
		// ignore
	}
	return {};
}

function writeJson(file: string, value: Record<string, unknown>): void {
	const json = `${JSON.stringify(value, null, "\t")}\n`;
	fs.mkdirSync(path.dirname(file), { recursive: true });
	if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === json) {
		return;
	}
	fs.writeFileSync(file, json, "utf8");
}

function writeVscode(root: string): void {
	const settingsPath = path.join(root, ".vscode", "settings.json");
	const current = readJsonObject(settingsPath);
	const associations = {
		...((current["files.associations"] && typeof current["files.associations"] === "object" && !Array.isArray(current["files.associations"]))
			? (current["files.associations"] as Record<string, unknown>)
			: {}),
		"*.clpp": "clpp",
		"*.clp": "clpp",
		"*.clh": "clpp",
		"*.server.clpp": "clpp",
		"*.client.clpp": "clpp",
		"*.plugin.clpp": "clpp",
		"*.flare": "flare",
		"*.hive": "hive",
		"*.mint": "mint",
		"*.bloom": "bloom",
		"*.helm": "helm",
		"*.shift": "shift",
		"*.axiom": "axiom",
	};
	writeJson(settingsPath, {
		...current,
		"files.associations": associations,
		"[luau]": {
			...((current["[luau]"] && typeof current["[luau]"] === "object" && !Array.isArray(current["[luau]"]))
				? (current["[luau]"] as Record<string, unknown>)
				: {}),
			"editor.insertSpaces": false,
			"editor.tabSize": 4,
			"editor.detectIndentation": false,
		},
	});

	const extensionsPath = path.join(root, ".vscode", "extensions.json");
	const extensions = readJsonObject(extensionsPath);
	writeJson(extensionsPath, {
		...extensions,
		recommendations: uniqueStrings(extensions.recommendations, ["kartzdev.cluaupp-flare"]),
		unwantedRecommendations: uniqueStrings(extensions.unwantedRecommendations, ["ms-vscode.cpptools"]),
	});
}

export function diagnosticsFor(_source?: string, _fileName?: string): CluauppDiagnostic[] {
	// Language diagnostics belong to `clpp install`. Do not spawn `clpp api compile`
	// from the editor — that duplicates source=clpp and freezes on every keystroke.
	return [];
}

function writeStylua(root: string): void {
	const dest = path.join(root, "stylua.toml");
	const body = `# cluaupp roblox luau
syntax = "Luau"
column_width = 120
line_endings = "Unix"
indent_type = "Tabs"
indent_width = 4
quote_style = "AutoPreferDouble"
call_parentheses = "Always"
collapse_simple_statement = "Never"
`;
	if (fs.existsSync(dest)) {
		const existing = fs.readFileSync(dest, "utf8");
		if (!existing.includes("cluaupp roblox luau") && existing.trim() !== "") {
			return;
		}
	}
	if (!fs.existsSync(dest) || fs.readFileSync(dest, "utf8") !== body) {
		fs.writeFileSync(dest, body, "utf8");
	}
}

export function syncEditorSupport(root: string, _config: Partial<ProjectConfig> = {}): void {
	writeVscode(root);
	writeStylua(root);
}

export function installEditorExtension(cluauppRoot = PACKAGE_ROOT): string[] {
	const from = path.join(cluauppRoot, "editors", "vscode");
	if (!fs.existsSync(from)) {
		return [];
	}
	const id = `kartzdev.cluaupp-flare-${pkg.version}`;
	const homes = [path.join(os.homedir(), ".cursor", "extensions"), path.join(os.homedir(), ".vscode", "extensions")];
	const installed: string[] = [];
	for (const home of homes) {
		if (!fs.existsSync(path.dirname(home))) {
			continue;
		}
		fs.mkdirSync(home, { recursive: true });
		try {
			for (const name of fs.readdirSync(home)) {
				if (name.startsWith("kartzdev.cluaupp-flare-") && name !== id) {
					fs.rmSync(path.join(home, name), { recursive: true, force: true });
				}
			}
		} catch {
			// ignore prune errors
		}
		const dest = path.join(home, id);
		copyDir(from, dest);
		fs.writeFileSync(path.join(dest, "cluaupp.root"), path.resolve(cluauppRoot), "utf8");
		const manifestPath = path.join(dest, "package.json");
		if (fs.existsSync(manifestPath)) {
			try {
				const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
				manifest.version = pkg.version;
				fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, "\t")}\n`, "utf8");
			} catch {
				// keep the copied manifest
			}
		}
		installed.push(dest);
	}

	const bin = editorBin();
	if (bin && installed[0]) {
		spawnSync(bin, ["--install-extension", installed[0], "--force"], {
			encoding: "utf8",
			windowsHide: true,
			timeout: 120000,
		});
	}
	return installed;
}

export async function installEditorSupport() {
	const local = installEditorExtension();
	if (local.length > 0) {
		console.log("cluaupp: schema IntelliSense installed (.flare .hive .mint .bloom .helm .shift .axiom)");
		for (const dest of local) {
			console.log(" ", dest);
		}
	}
	if (hasClpp()) {
		const result = spawnSync("clpp", ["install"], { encoding: "utf8", windowsHide: true });
		if (result.status === 0) {
			console.log(String(result.stderr || result.stdout || "clpp install ok").trim());
		} else {
			console.log("cluaupp:", CLPP_INSTALL_HINT);
		}
	} else {
		console.log("cluaupp:", CLPP_INSTALL_HINT);
	}
	return { local };
}

export const isClppSource = isSourceFile;
