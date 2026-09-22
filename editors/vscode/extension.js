"use strict";

const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

const KIND = {
	keyword: vscode.CompletionItemKind.Keyword,
	type: vscode.CompletionItemKind.TypeParameter,
	snippet: vscode.CompletionItemKind.Snippet,
	value: vscode.CompletionItemKind.EnumMember,
	field: vscode.CompletionItemKind.Field,
};

const SEVERITY = {
	error: vscode.DiagnosticSeverity.Error,
	warning: vscode.DiagnosticSeverity.Warning,
	hint: vscode.DiagnosticSeverity.Hint,
};

const SYMBOL = {
	packet: vscode.SymbolKind.Event,
	query: vscode.SymbolKind.Method,
	option: vscode.SymbolKind.Namespace,
};

function loadLanguage(context) {
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
	roots.push(path.join(context.extensionPath, "..", "..", ".."));
	for (const root of roots) {
		const engine = path.join(root, "generated", "flare", "language.js");
		if (fs.existsSync(engine)) {
			return { language: require(engine), root, enginePath: engine };
		}
	}
	throw new Error("Cluaupp Flare language engine not found. Run `cluaupp intellisense` from a Cluaupp install.");
}

function isFlareDoc(document) {
	if (!document) {
		return false;
	}
	if (document.languageId === "flare") {
		return true;
	}
	return document.uri.fsPath.toLowerCase().endsWith(".flare");
}

function activate(context) {
	let loaded;
	try {
		loaded = loadLanguage(context);
	} catch (err) {
		vscode.window.showWarningMessage(String(err.message || err));
		return;
	}

	const collection = vscode.languages.createDiagnosticCollection("flare");
	context.subscriptions.push(collection);

	const selector = [{ language: "flare", scheme: "file" }, { pattern: "**/*.flare", scheme: "file" }];

	const refresh = (document) => {
		if (!isFlareDoc(document)) {
			return;
		}
		const diagnostics = loaded.language.diagnoseFlare(document.getText(), document.uri.fsPath).map((item) => {
			const range = new vscode.Range(item.line, item.start, item.line, Math.max(item.end, item.start + 1));
			const diagnostic = new vscode.Diagnostic(range, item.message, SEVERITY[item.severity] ?? vscode.DiagnosticSeverity.Error);
			diagnostic.source = "flare";
			return diagnostic;
		});
		collection.set(document.uri, diagnostics);
	};

	async function openClppPath(relPath, line) {
		const folders = vscode.workspace.workspaceFolders || [];
		if (!folders.length || !relPath) {
			return;
		}
		const root = folders[0].uri.fsPath;
		const candidates = [
			path.join(root, relPath),
			path.join(root, "src", relPath),
			path.join(root, relPath.replace(/^src[\\/]/, "")),
		];
		let file = null;
		for (const c of candidates) {
			if (fs.existsSync(c)) {
				file = c;
				break;
			}
		}
		if (!file) {
			vscode.window.showWarningMessage(`Cluaupp bridge: file not found ${relPath}`);
			return;
		}
		const doc = await vscode.workspace.openTextDocument(file);
		const editor = await vscode.window.showTextDocument(doc, { preview: false });
		if (line && line > 0) {
			const pos = new vscode.Position(Math.max(0, line - 1), 0);
			editor.selection = new vscode.Selection(pos, pos);
			editor.revealRange(new vscode.Range(pos, pos));
		}
	}

	let bridgeSince = 0;
	let bridgeTimer = null;
	const startBridgePoll = () => {
		if (bridgeTimer) {
			return;
		}
		const cfg = () => vscode.workspace.getConfiguration("cluaupp");
		bridgeTimer = setInterval(async () => {
			const base = cfg().get("bridgeUrl") || "http://127.0.0.1:3847";
			try {
				const res = await fetch(`${base}/events?since=${bridgeSince}`);
				if (!res.ok) {
					return;
				}
				const data = await res.json();
				for (const ev of data.events || []) {
					bridgeSince = Math.max(bridgeSince, ev.id || 0);
					if ((ev.type === "open" || ev.type === "error") && ev.path) {
						await openClppPath(ev.path, ev.line);
						if (ev.type === "error" && ev.message) {
							vscode.window.showErrorMessage(`Studio: ${ev.message} (${ev.path}:${ev.line || "?"})`);
						}
					}
				}
			} catch {
				/* bridge offline */
			}
		}, Number(cfg().get("bridgePollMs") || 1000));
		context.subscriptions.push({
			dispose: () => {
				if (bridgeTimer) {
					clearInterval(bridgeTimer);
					bridgeTimer = null;
				}
			},
		});
		vscode.window.showInformationMessage("Cluaupp: polling Studio bridge");
	};

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(refresh),
		vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
		vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
		vscode.commands.registerCommand("cluaupp.restartIntelliSense", () => {
			try {
				delete require.cache[require.resolve(loaded.enginePath)];
				loaded = loadLanguage(context);
				collection.clear();
				for (const document of vscode.workspace.textDocuments) {
					refresh(document);
				}
				vscode.window.showInformationMessage("Cluaupp Flare IntelliSense reloaded.");
			} catch (err) {
				vscode.window.showErrorMessage(String(err.message || err));
			}
		}),
		vscode.commands.registerCommand("cluaupp.startBridgePoll", () => startBridgePoll()),
		vscode.commands.registerCommand("cluaupp.openFromBridge", async () => {
			const pathInput = await vscode.window.showInputBox({ prompt: "CL++ relative path" });
			if (pathInput) {
				await openClppPath(pathInput, 1);
			}
		}),
		vscode.languages.registerCompletionItemProvider(
			selector,
			{
				provideCompletionItems(document, position) {
					return loaded.language.completionsAt(document.getText(), position.line, position.character).map((entry) => {
						const item = new vscode.CompletionItem(entry.label, KIND[entry.kind]);
						item.detail = entry.detail;
						item.documentation = new vscode.MarkdownString(entry.documentation);
						item.insertText = entry.snippet ? new vscode.SnippetString(entry.insertText) : entry.insertText;
						item.sortText = entry.sortText;
						return item;
					});
				},
			},
			" ",
			"(",
			",",
			">",
			"=",
		),
		vscode.languages.registerHoverProvider(selector, {
			provideHover(document, position) {
				const hover = loaded.language.hoverAt(document.getText(), position.line, position.character);
				if (!hover) {
					return null;
				}
				const range = new vscode.Range(position.line, hover.start, position.line, hover.end);
				return new vscode.Hover(new vscode.MarkdownString(hover.contents), range);
			},
		}),
		vscode.languages.registerDocumentSymbolProvider(selector, {
			provideDocumentSymbols(document) {
				return loaded.language.symbolsIn(document.getText()).map((symbol) => {
					const range = new vscode.Range(symbol.line, 0, symbol.line, Math.max(symbol.end, 1));
					const selection = new vscode.Range(symbol.line, symbol.start, symbol.line, Math.max(symbol.end, symbol.start + 1));
					return new vscode.DocumentSymbol(symbol.name, symbol.detail, SYMBOL[symbol.kind], range, selection);
				});
			},
		}),
		vscode.languages.registerSignatureHelpProvider(
			selector,
			{
				provideSignatureHelp(document, position) {
					const signature = loaded.language.signatureAt(document.getText(), position.line, position.character);
					if (!signature) {
						return null;
					}
					const help = new vscode.SignatureHelp();
					const info = new vscode.SignatureInformation(signature.label, signature.documentation);
					info.parameters = signature.parameters.map(
						(parameter) => new vscode.ParameterInformation(parameter.label, parameter.documentation),
					);
					help.signatures = [info];
					help.activeSignature = 0;
					help.activeParameter = signature.activeParameter;
					return help;
				},
			},
			"(",
			",",
		),
		vscode.languages.registerCodeActionsProvider(selector, {
			provideCodeActions(document, _range, actionContext) {
				const actions = [];
				for (const diagnostic of actionContext.diagnostics) {
					const match = String(diagnostic.message).match(/did you mean '([^']+)'/);
					if (!match) {
						continue;
					}
					const edit = new vscode.WorkspaceEdit();
					edit.replace(document.uri, diagnostic.range, match[1]);
					const action = new vscode.CodeAction(`Replace with ${match[1]}`, vscode.CodeActionKind.QuickFix);
					action.diagnostics = [diagnostic];
					action.edit = edit;
					action.isPreferred = true;
					actions.push(action);
				}
				return actions;
			},
		}),
	);

	for (const document of vscode.workspace.textDocuments) {
		refresh(document);
	}

	const folders = vscode.workspace.workspaceFolders || [];
	if (folders.some((f) => fs.existsSync(path.join(f.uri.fsPath, "default.project.json")))) {
		startBridgePoll();
	}
}

function deactivate() {}

module.exports = { activate, deactivate };
