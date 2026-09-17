import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "./parse.js";
import { preprocess } from "./preprocess.js";
import { findClangPlusPlus, installMarketplaceExtension, ensureLlvm, CLANGD_ID, reportInstall } from "./editor-install.js";
import { pkg, projectRoot as PACKAGE_ROOT } from "./package-info.js";
import type { ProjectConfig } from "./types.js";
import type { PreprocessOptions } from "./ast.js";

export type CluauppDiagnostic = {
	line: number;
	col: number;
	message: string;
	severity: "error";
};

function posix(file: string): string {
	return String(file).replace(/\\/g, "/");
}

function collectFiles(dir: string, files: string[] = []): string[] {
	if (!fs.existsSync(dir)) {
		return files;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectFiles(full, files);
		} else {
			files.push(full);
		}
	}
	return files;
}

function isCppFile(file: string): boolean {
	return /\.(cpp|cc|cxx|c|h|hpp|hh)$/i.test(file);
}

function clangCompileArgs(root: string): string[] {
	const absRoot = posix(path.resolve(root));
	const absInclude = posix(path.join(absRoot, "include"));
	const absSrc = posix(path.join(absRoot, "src"));
	const roblox = posix(path.join(absInclude, "cluaupp", "roblox.hpp"));
	return [
		"-xc++",
		"-std=c++20",
		"-ferror-limit=0",
		"-I" + absInclude,
		"-I" + absSrc,
		"-Iinclude",
		"-Isrc",
		"-include",
		roblox,
	];
}

function compileCommandEntry(root: string, file: string) {
	const absRoot = posix(path.resolve(root));
	const absFile = posix(path.resolve(file));
	return {
		directory: absRoot,
		file: absFile,
		arguments: [clangPath(), ...clangCompileArgs(root), "-c", absFile],
	};
}

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

function stripCppToolsSettings(current: Record<string, unknown>): Record<string, unknown> {
	const next: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(current)) {
		if (key === "C_Cpp" || key.startsWith("C_Cpp.")) {
			continue;
		}
		next[key] = value;
	}
	return next;
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
		// ignore corrupt editor json
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

function clangdEditorArgs(): string[] {
	return [
		"--compile-commands-dir=${workspaceFolder}",
		"--header-insertion=never",
		"--query-driver=**/clang++*,**/clang++.exe,**/g++*,**/g++.exe",
	];
}

export function clangPath(): string {
	return findClangPlusPlus() || "clang++";
}

export function writeCompileCommands(root: string, srcDir: string): boolean {
	const files = collectFiles(srcDir).filter((file) => isCppFile(file)).sort();
	const json = `${JSON.stringify(files.map((file) => compileCommandEntry(root, file)), null, "\t")}\n`;
	const dest = path.join(root, "compile_commands.json");
	if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === json) {
		return false;
	}
	fs.writeFileSync(dest, json, "utf8");
	return true;
}

export function writeClangd(root: string): boolean {
	const flags = clangCompileArgs(root)
		.map((flag) => `    - ${flag}`)
		.join("\n");
	const contents = `CompileFlags:
  CompilationDatabase: .
  Add:
${flags}

Diagnostics:
  Suppress: '*'

---
If:
  PathMatch: .*\\.(cpp|cc|cxx|c|h|hpp|hh)$
CompileFlags:
  Add:
    - -xc++

---
If:
  PathMatch: (out|libs)/.*
Index:
  Background: Skip
`;
	const dest = path.join(root, ".clangd");
	if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === contents) {
		return false;
	}
	fs.writeFileSync(dest, contents, "utf8");
	return true;
}

function writeVscode(root: string): void {
	const settingsPath = path.join(root, ".vscode", "settings.json");
	const current = readJsonObject(settingsPath);
	const associations = {
		...((current["files.associations"] && typeof current["files.associations"] === "object" && !Array.isArray(current["files.associations"]))
			? (current["files.associations"] as Record<string, unknown>)
			: {}),
		"*.hpp": "cpp",
		"*.h": "cpp",
		"*.server.cpp": "cpp",
		"*.client.cpp": "cpp",
		"*.plugin.cpp": "cpp",
		"*.legacy.cpp": "cpp",
		"*.legacy.server.cpp": "cpp",
		"*.legacy.client.cpp": "cpp",
	};
	writeJson(settingsPath, {
		...stripCppToolsSettings(current),
		"clangd.enable": true,
		"clangd.arguments": clangdEditorArgs(),
		"files.associations": associations,
	});

	const extensionsPath = path.join(root, ".vscode", "extensions.json");
	const extensions = readJsonObject(extensionsPath);
	writeJson(extensionsPath, {
		...extensions,
		recommendations: uniqueStrings(extensions.recommendations, ["llvm-vs-code-extensions.vscode-clangd"]),
		unwantedRecommendations: uniqueStrings(extensions.unwantedRecommendations, ["ms-vscode.cpptools"]),
	});

	const props = path.join(root, ".vscode", "c_cpp_properties.json");
	if (fs.existsSync(props)) {
		fs.unlinkSync(props);
	}
}

export function diagnosticsFor(source: string, fileName?: string, options: PreprocessOptions = {}): CluauppDiagnostic[] {
	try {
		const prepared = options.filePath ? preprocess(source, options.filePath, options) : source;
		parse(prepared, fileName || "input.cpp");
		return [];
	} catch (err) {
		const error = err as { message?: string; line?: number; col?: number };
		const message = error.message ? String(error.message) : "parse error";
		const match = message.match(/:(\d+):(\d+):\s*(.*)$/);
		if (match) {
			return [{ line: Number(match[1]), col: Number(match[2]), message: match[3], severity: "error" }];
		}
		return [{ line: error.line || 1, col: error.col || 1, message, severity: "error" }];
	}
}

export function syncEditorSupport(root: string, config: Partial<ProjectConfig> = {}): void {
	const srcDir = path.join(root, config.rootDir || "src");
	if (fs.existsSync(srcDir)) {
		writeCompileCommands(root, srcDir);
	}
	writeClangd(root);
	writeVscode(root);
	const flags = ["-xc++", "-std=c++20", "-ferror-limit=0", "-Iinclude", "-Isrc", "-include", "include/cluaupp/roblox.hpp"].join("\n") + "\n";
	const flagsFile = path.join(root, "compile_flags.txt");
	if (!fs.existsSync(flagsFile) || fs.readFileSync(flagsFile, "utf8") !== flags) {
		fs.writeFileSync(flagsFile, flags, "utf8");
	}
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

export async function installEditorSupport(cluauppRoot = PACKAGE_ROOT) {
	const local = installEditorExtension(cluauppRoot);
	const llvm = ensureLlvm();
	reportInstall(llvm, "LLVM clang++");
	const clangd = await installMarketplaceExtension(CLANGD_ID, "clangd (LLVM)");
	reportInstall(clangd, "clangd");
	console.log("cluaupp: C++ completion is clangd — reload the editor (Ctrl+Shift+P → Developer: Reload Window)");
	return { local, llvm, clangd };
}
