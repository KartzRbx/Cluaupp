import path from "node:path";
import {
	createConnection,
	ProposedFeatures,
	TextDocuments,
	TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { diagnosticsFor } from "./intellisense.js";
import { pkg } from "./package-info.js";

function uriPath(uri: string): string {
	let file = String(uri || "").replace(/^file:\/\//, "");
	if (/^\/[A-Za-z]:/.test(file)) {
		file = file.slice(1);
	}
	return decodeURIComponent(file);
}

export function start(options: { projectRoot?: string } = {}): void {
	const projectRoot = options.projectRoot || process.cwd();
	const connection = createConnection(ProposedFeatures.all);
	const documents = new TextDocuments(TextDocument);

	connection.onInitialize(() => ({
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full,
		},
		serverInfo: { name: "cluaupp", version: pkg.version },
	}));

	const publish = (document: TextDocument) => {
		const file = uriPath(document.uri);
		const items = diagnosticsFor(document.getText(), file, {
			filePath: file,
			includeDirs: [path.dirname(file), path.join(projectRoot, "src"), path.join(projectRoot, "include")],
		});
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
