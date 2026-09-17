"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const intellisense_js_1 = require("./intellisense.js");
const package_info_js_1 = require("./package-info.js");
function uriPath(uri) {
    let file = String(uri || "").replace(/^file:\/\//, "");
    if (/^\/[A-Za-z]:/.test(file)) {
        file = file.slice(1);
    }
    return decodeURIComponent(file);
}
function start(options = {}) {
    const projectRoot = options.projectRoot || process.cwd();
    const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
    const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
    connection.onInitialize(() => ({
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Full,
        },
        serverInfo: { name: "cluaupp", version: package_info_js_1.pkg.version },
    }));
    const publish = (document) => {
        const file = uriPath(document.uri);
        const items = (0, intellisense_js_1.diagnosticsFor)(document.getText(), file);
        connection.sendDiagnostics({
            uri: document.uri,
            diagnostics: items.map((item) => ({
                range: {
                    start: { line: Math.max(0, (item.line || 1) - 1), character: Math.max(0, (item.col || 1) - 1) },
                    end: { line: Math.max(0, (item.line || 1) - 1), character: Math.max(1, item.col || 1) },
                },
                severity: 1,
                source: "cluaupp",
                message: item.message,
            })),
        });
    };
    documents.onDidOpen((event) => publish(event.document));
    documents.onDidChangeContent((event) => publish(event.document));
    documents.onDidClose((event) => {
        connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
    });
    documents.listen(connection);
    connection.listen();
}
