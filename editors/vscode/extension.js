"use strict";

const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

function loadEngine(context) {
	const folders = vscode.workspace.workspaceFolders || [];
	const workspaceFolder = folders[0] ? folders[0].uri.fsPath : null;
	const rootFile = path.join(context.extensionPath, "cluaupp.root");
	const roots = [];
	if (fs.existsSync(rootFile)) {
		roots.push(fs.readFileSync(rootFile, "utf8").trim());
	}
	if (workspaceFolder) {
		roots.push(path.join(workspaceFolder, "..", "Cluaupp"));
		roots.push(path.join(workspaceFolder, "node_modules", "cluaupp"));
	}
	roots.push(path.join(context.extensionPath, "..", ".."));
	for (const root of roots) {
		const candidates = [
			path.join(root, "generated", "intellisense.js"),
			path.join(root, "src", "intellisense.js"),
		];
		for (const engine of candidates) {
			if (fs.existsSync(engine)) {
				return { engine: require(engine), root, workspaceFolder, enginePath: engine };
			}
		}
	}
	throw new Error("Cluaupp diagnostics engine not found. Run `cluaupp intellisense` in the game folder.");
}

function activate(context) {
	let loaded;
	try {
		loaded = loadEngine(context);
	} catch (err) {
		vscode.window.showWarningMessage(String(err.message || err));
		return;
	}

	const diagnostics = vscode.languages.createDiagnosticCollection("cluaupp");
	context.subscriptions.push(diagnostics);

	const optionsFor = (document) => ({
		projectRoot: loaded.workspaceFolder || path.dirname(document.uri.fsPath),
		file: document.uri.fsPath,
		filePath: document.uri.fsPath,
		includeDirs: [
			path.dirname(document.uri.fsPath),
			path.join(loaded.workspaceFolder || "", "src"),
			path.join(loaded.workspaceFolder || "", "include"),
		],
	});

	const refreshDiagnostics = (document) => {
		if (!document || (document.languageId !== "clpp" && document.languageId !== "cpp")) {
			return;
		}
		if (typeof loaded.engine.diagnosticsFor !== "function") {
			return;
		}
		const items = loaded.engine.diagnosticsFor(document.getText(), document.uri.fsPath, optionsFor(document));
		diagnostics.set(
			document.uri,
			items.map((item) => {
				const line = Math.max(0, (item.line || 1) - 1);
				const col = Math.max(0, (item.col || 1) - 1);
				const range = new vscode.Range(line, col, line, col + 1);
				return new vscode.Diagnostic(range, item.message, vscode.DiagnosticSeverity.Error);
			}),
		);
	};

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => refreshDiagnostics(event.document)),
		vscode.workspace.onDidOpenTextDocument(refreshDiagnostics),
		vscode.commands.registerCommand("cluaupp.restartIntelliSense", () => {
			try {
				delete require.cache[require.resolve(loaded.enginePath)];
				loaded = loadEngine(context);
				vscode.window.showInformationMessage("Cluaupp diagnostics reloaded. C++ completion is clangd.");
			} catch (err) {
				vscode.window.showErrorMessage(String(err.message || err));
			}
		}),
	);

	for (const document of vscode.workspace.textDocuments) {
		refreshDiagnostics(document);
	}
}

function deactivate() {}

module.exports = { activate, deactivate };
