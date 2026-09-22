import {
	CompletionItemKind,
	DiagnosticSeverity,
	MarkupKind,
	ParameterInformation,
	ProposedFeatures,
	SignatureInformation,
	SymbolKind,
	TextDocuments,
	TextDocumentSyncKind,
	createConnection,
	type CompletionItem,
	type Diagnostic,
	type DocumentSymbol,
	type Hover,
	type SignatureHelp,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
	completionsAt,
	hoverAt,
	isFlareDocument,
	signatureAt,
	symbolsIn,
	diagnoseFlare,
	type FlareCompletionKind,
	type FlareSeverity,
} from "./flare/language.js";
import { pkg } from "./package-info.js";

const KIND: Record<FlareCompletionKind, CompletionItemKind> = {
	keyword: CompletionItemKind.Keyword,
	type: CompletionItemKind.TypeParameter,
	snippet: CompletionItemKind.Snippet,
	value: CompletionItemKind.EnumMember,
	field: CompletionItemKind.Field,
};

const SEVERITY: Record<FlareSeverity, DiagnosticSeverity> = {
	error: DiagnosticSeverity.Error,
	warning: DiagnosticSeverity.Warning,
	hint: DiagnosticSeverity.Hint,
};

const SYMBOL: Record<"packet" | "query" | "option", SymbolKind> = {
	packet: SymbolKind.Event,
	query: SymbolKind.Method,
	option: SymbolKind.Namespace,
};

function flareDiagnostics(document: TextDocument): Diagnostic[] {
	return diagnoseFlare(document.getText(), document.uri).map((item) => ({
		range: {
			start: { line: item.line, character: item.start },
			end: { line: item.line, character: Math.max(item.end, item.start + 1) },
		},
		message: item.message,
		severity: SEVERITY[item.severity],
		source: "flare",
	}));
}

export function start(_options: { projectRoot?: string } = {}): void {
	const connection = createConnection(ProposedFeatures.all);
	const documents = new TextDocuments(TextDocument);

	connection.onInitialize(() => ({
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				triggerCharacters: [" ", "(", ",", ">", "="],
				resolveProvider: false,
			},
			hoverProvider: true,
			documentSymbolProvider: true,
			signatureHelpProvider: {
				triggerCharacters: ["(", ","],
			},
		},
		serverInfo: { name: "cluaupp-flare", version: pkg.version },
	}));

	const publish = (document: TextDocument) => {
		if (!isFlareDocument(document.uri)) {
			connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
			return;
		}
		connection.sendDiagnostics({ uri: document.uri, diagnostics: flareDiagnostics(document) });
	};

	documents.onDidOpen((event) => publish(event.document));
	documents.onDidChangeContent((event) => publish(event.document));
	documents.onDidClose((event) => {
		connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
	});

	connection.onCompletion((params): CompletionItem[] => {
		const document = documents.get(params.textDocument.uri);
		if (!document || !isFlareDocument(document.uri)) {
			return [];
		}
		return completionsAt(document.getText(), params.position.line, params.position.character).map((item) => ({
			label: item.label,
			kind: KIND[item.kind],
			detail: item.detail,
			documentation: { kind: MarkupKind.Markdown, value: item.documentation },
			insertText: item.insertText,
			insertTextFormat: item.snippet ? 2 : 1,
			sortText: item.sortText,
		}));
	});

	connection.onHover((params): Hover | null => {
		const document = documents.get(params.textDocument.uri);
		if (!document || !isFlareDocument(document.uri)) {
			return null;
		}
		const hover = hoverAt(document.getText(), params.position.line, params.position.character);
		if (!hover) {
			return null;
		}
		return {
			contents: { kind: MarkupKind.Markdown, value: hover.contents },
			range: {
				start: { line: params.position.line, character: hover.start },
				end: { line: params.position.line, character: hover.end },
			},
		};
	});

	connection.onDocumentSymbol((params): DocumentSymbol[] => {
		const document = documents.get(params.textDocument.uri);
		if (!document || !isFlareDocument(document.uri)) {
			return [];
		}
		return symbolsIn(document.getText()).map((symbol) => ({
			name: symbol.name,
			detail: symbol.detail,
			kind: SYMBOL[symbol.kind],
			range: {
				start: { line: symbol.line, character: 0 },
				end: { line: symbol.line, character: Math.max(symbol.end, 1) },
			},
			selectionRange: {
				start: { line: symbol.line, character: symbol.start },
				end: { line: symbol.line, character: Math.max(symbol.end, symbol.start + 1) },
			},
		}));
	});

	connection.onSignatureHelp((params): SignatureHelp | null => {
		const document = documents.get(params.textDocument.uri);
		if (!document || !isFlareDocument(document.uri)) {
			return null;
		}
		const signature = signatureAt(document.getText(), params.position.line, params.position.character);
		if (!signature) {
			return null;
		}
		const info = SignatureInformation.create(
			signature.label,
			signature.documentation,
			...signature.parameters.map((parameter) => ParameterInformation.create(parameter.label, parameter.documentation)),
		);
		return {
			signatures: [info],
			activeSignature: 0,
			activeParameter: signature.activeParameter,
		};
	});

	documents.listen(connection);
	connection.listen();
}
