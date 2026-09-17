import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pkg, projectRoot as PACKAGE_ROOT } from "./package-info.js";
import type { ProjectConfig } from "./types.js";
import { CLPP_INSTALL_HINT } from "./clpp/contract.js";
import { compileViaClpp, hasClpp } from "./clpp/runner.js";
import { isSourceFile } from "./clpp/paths.js";

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
	};
	writeJson(settingsPath, {
		...current,
		"files.associations": associations,
	});

	const extensionsPath = path.join(root, ".vscode", "extensions.json");
	const extensions = readJsonObject(extensionsPath);
	writeJson(extensionsPath, {
		...extensions,
		recommendations: uniqueStrings(extensions.recommendations),
		unwantedRecommendations: uniqueStrings(extensions.unwantedRecommendations, ["ms-vscode.cpptools"]),
	});
}

export function diagnosticsFor(source: string, fileName?: string): CluauppDiagnostic[] {
	if (!hasClpp()) {
		return [];
	}
	try {
		compileViaClpp({ source, fileName: fileName || "input.clpp" });
		return [];
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const match = message.match(/:(\d+):(\d+):\s*(.*)$/);
		if (match) {
			return [{ line: Number(match[1]), col: Number(match[2]), message: match[3], severity: "error" }];
		}
		return [{ line: 1, col: 1, message, severity: "error" }];
	}
}

export function syncEditorSupport(root: string, _config: Partial<ProjectConfig> = {}): void {
	writeVscode(root);
}

export function installEditorExtension(cluauppRoot = PACKAGE_ROOT): string[] {
	const from = path.join(cluauppRoot, "editors", "vscode");
	if (!fs.existsSync(from)) {
		return [];
	}
	const id = `kartzdev.cluaupp-diagnostics-${pkg.version}`;
	const homes = [path.join(os.homedir(), ".cursor", "extensions"), path.join(os.homedir(), ".vscode", "extensions")];
	const installed: string[] = [];
	for (const home of homes) {
		if (!fs.existsSync(path.dirname(home))) {
			continue;
		}
		fs.mkdirSync(home, { recursive: true });
		const dest = path.join(home, id);
		copyDir(from, dest);
		fs.writeFileSync(path.join(dest, "cluaupp.root"), path.resolve(cluauppRoot), "utf8");
		installed.push(dest);
	}
	return installed;
}

export async function installEditorSupport() {
	const local = installEditorExtension();
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
