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
		const engine = path.join(root, "src", "intellisense.js");
		if (fs.existsSync(engine)) {
			return { engine: require(engine), root, workspaceFolder };
		}
	}
	throw new Error("Cluaupp IntelliSense engine not found. Run `cluaupp intellisense` in the game folder.");
}

function kindOf(kind) {
	const map = {
		method: vscode.CompletionItemKind.Method,
		function: vscode.CompletionItemKind.Function,
		constructor: vscode.CompletionItemKind.Constructor,
		property: vscode.CompletionItemKind.Property,
		variable: vscode.CompletionItemKind.Variable,
		class: vscode.CompletionItemKind.Class,
		enum: vscode.CompletionItemKind.Enum,
		keyword: vscode.CompletionItemKind.Keyword,
		event: vscode.CompletionItemKind.Event,
		file: vscode.CompletionItemKind.File,
	};
	return map[kind] || vscode.CompletionItemKind.Text;
}

function activate(context) {
	let loaded;
	try {
		loaded = loadEngine(context);
	} catch (err) {
		vscode.window.showWarningMessage(String(err.message || err));
		return;
	}

	const selector = { language: "cpp", scheme: "file" };
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
		if (!document || document.languageId !== "cpp") {
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
		vscode.languages.registerCompletionItemProvider(
			selector,
			{
				provideCompletionItems(document, position) {
					const offset = document.offsetAt(position);
					const items = loaded.engine.completeAt(document.getText(), offset, optionsFor(document));
					return items.map((item) => {
						const completion = new vscode.CompletionItem(item.name, kindOf(item.kind));
						completion.detail = item.detail || item.type || "";
						completion.sortText = `${item.kind === "keyword" ? "2" : "0"}_${item.name}`;
						completion.insertText = item.name;
						return completion;
					});
				},
			},
			".",
			":",
			">",
			"<",
			'"',
			"/",
		),
		vscode.languages.registerHoverProvider(selector, {
			provideHover(document, position) {
				const hover = loaded.engine.hoverAt(document.getText(), document.offsetAt(position), optionsFor(document));
				if (!hover) {
					return null;
				}
				return new vscode.Hover(new vscode.MarkdownString(`**${hover.name}**\n\n\`${hover.detail || hover.type || ""}\``));
			},
		}),
		vscode.languages.registerDefinitionProvider(selector, {
			provideDefinition(document, position) {
				const def = loaded.engine.definitionAt(document.getText(), document.offsetAt(position), optionsFor(document));
				if (!def || !def.file) {
					return null;
				}
				return new vscode.Location(vscode.Uri.file(def.file), new vscode.Position(Math.max(0, (def.line || 1) - 1), 0));
			},
		}),
		vscode.workspace.onDidChangeTextDocument((event) => refreshDiagnostics(event.document)),
		vscode.workspace.onDidOpenTextDocument(refreshDiagnostics),
		vscode.commands.registerCommand("cluaupp.restartIntelliSense", () => {
			try {
				delete require.cache[require.resolve(path.join(loaded.root, "src", "intellisense.js"))];
				loaded = loadEngine(context);
				vscode.window.showInformationMessage("Cluaupp IntelliSense reloaded.");
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
