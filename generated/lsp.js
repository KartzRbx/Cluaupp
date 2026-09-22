"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const language_js_1 = require("./flare/language.js");
const package_info_js_1 = require("./package-info.js");
const KIND = {
    keyword: node_1.CompletionItemKind.Keyword,
    type: node_1.CompletionItemKind.TypeParameter,
    snippet: node_1.CompletionItemKind.Snippet,
    value: node_1.CompletionItemKind.EnumMember,
    field: node_1.CompletionItemKind.Field,
};
const SEVERITY = {
    error: node_1.DiagnosticSeverity.Error,
    warning: node_1.DiagnosticSeverity.Warning,
    hint: node_1.DiagnosticSeverity.Hint,
};
const SYMBOL = {
    packet: node_1.SymbolKind.Event,
    query: node_1.SymbolKind.Method,
    option: node_1.SymbolKind.Namespace,
};
function flareDiagnostics(document) {
    return (0, language_js_1.diagnoseFlare)(document.getText(), document.uri).map((item) => ({
        range: {
            start: { line: item.line, character: item.start },
            end: { line: item.line, character: Math.max(item.end, item.start + 1) },
        },
        message: item.message,
        severity: SEVERITY[item.severity],
        source: "flare",
    }));
}
function start(_options = {}) {
    const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
    const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
    connection.onInitialize(() => ({
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
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
        serverInfo: { name: "cluaupp-flare", version: package_info_js_1.pkg.version },
    }));
    const publish = (document) => {
        if (!(0, language_js_1.isFlareDocument)(document.uri)) {
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
    connection.onCompletion((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document || !(0, language_js_1.isFlareDocument)(document.uri)) {
            return [];
        }
        return (0, language_js_1.completionsAt)(document.getText(), params.position.line, params.position.character).map((item) => ({
            label: item.label,
            kind: KIND[item.kind],
            detail: item.detail,
            documentation: { kind: node_1.MarkupKind.Markdown, value: item.documentation },
            insertText: item.insertText,
            insertTextFormat: item.snippet ? 2 : 1,
            sortText: item.sortText,
        }));
    });
    connection.onHover((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document || !(0, language_js_1.isFlareDocument)(document.uri)) {
            return null;
        }
        const hover = (0, language_js_1.hoverAt)(document.getText(), params.position.line, params.position.character);
        if (!hover) {
            return null;
        }
        return {
            contents: { kind: node_1.MarkupKind.Markdown, value: hover.contents },
            range: {
                start: { line: params.position.line, character: hover.start },
                end: { line: params.position.line, character: hover.end },
            },
        };
    });
    connection.onDocumentSymbol((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document || !(0, language_js_1.isFlareDocument)(document.uri)) {
            return [];
        }
        return (0, language_js_1.symbolsIn)(document.getText()).map((symbol) => ({
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
    connection.onSignatureHelp((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document || !(0, language_js_1.isFlareDocument)(document.uri)) {
            return null;
        }
        const signature = (0, language_js_1.signatureAt)(document.getText(), params.position.line, params.position.character);
        if (!signature) {
            return null;
        }
        const info = node_1.SignatureInformation.create(signature.label, signature.documentation, ...signature.parameters.map((parameter) => node_1.ParameterInformation.create(parameter.label, parameter.documentation)));
        return {
            signatures: [info],
            activeSignature: 0,
            activeParameter: signature.activeParameter,
        };
    });
    documents.listen(connection);
    connection.listen();
}
