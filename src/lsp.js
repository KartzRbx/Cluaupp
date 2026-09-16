"use strict";

const { completeAt, hoverAt, definitionAt, diagnosticsFor } = require("./intellisense");

function readMessage(buffer) {
	const headerEnd = buffer.indexOf("\r\n\r\n");
	if (headerEnd < 0) {
		return null;
	}
	const header = buffer.slice(0, headerEnd).toString("utf8");
	const match = header.match(/Content-Length:\s*(\d+)/i);
	if (!match) {
		return null;
	}
	const length = Number(match[1]);
	const start = headerEnd + 4;
	if (buffer.length < start + length) {
		return null;
	}
	const json = buffer.slice(start, start + length).toString("utf8");
	return { message: JSON.parse(json), rest: buffer.slice(start + length) };
}

function send(message) {
	const json = JSON.stringify(message);
	const payload = Buffer.from(json, "utf8");
	process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
	process.stdout.write(payload);
}

function posToOffset(text, position) {
	const lines = text.split(/\n/);
	let offset = 0;
	for (let i = 0; i < position.line; i += 1) {
		offset += (lines[i] || "").length + 1;
	}
	return offset + (position.character || 0);
}

function kindNumber(kind) {
	switch (kind) {
		case "method":
		case "function":
			return 3;
		case "constructor":
			return 4;
		case "property":
		case "variable":
			return 6;
		case "class":
			return 7;
		case "enum":
			return 13;
		case "keyword":
			return 14;
		case "event":
			return 23;
		case "file":
			return 17;
		default:
			return 1;
	}
}

function start(options = {}) {
	const projectRoot = options.projectRoot || process.cwd();
	const documents = new Map();
	let buffer = Buffer.alloc(0);
	let id = 0;

	const uriPath = (uri) => {
		let file = String(uri || "").replace(/^file:\/\//, "");
		if (/^\/[A-Za-z]:/.test(file)) {
			file = file.slice(1);
		}
		return decodeURIComponent(file);
	};

	const docText = (uri) => documents.get(uri) || "";

	const publishDiagnostics = (uri) => {
		const file = uriPath(uri);
		const text = docText(uri);
		const items = diagnosticsFor(text, file, {
			filePath: file,
			projectRoot,
			includeDirs: [pathDirname(file), require("path").join(projectRoot, "src"), require("path").join(projectRoot, "include")],
		});
		send({
			jsonrpc: "2.0",
			method: "textDocument/publishDiagnostics",
			params: {
				uri,
				diagnostics: items.map((item) => ({
					range: {
						start: { line: Math.max(0, (item.line || 1) - 1), character: Math.max(0, (item.col || 1) - 1) },
						end: { line: Math.max(0, (item.line || 1) - 1), character: Math.max(1, item.col || 1) },
					},
					severity: 1,
					source: "cluaupp",
					message: item.message,
				})),
			},
		});
	};

	const pathDirname = (file) => require("path").dirname(file);

	const handle = (message) => {
		const { method, params, id: reqId } = message;
		if (method === "initialize") {
			send({
				jsonrpc: "2.0",
				id: reqId,
				result: {
					capabilities: {
						textDocumentSync: 1,
						completionProvider: { triggerCharacters: [".", ":", ">", "<", '"', "/"] },
						hoverProvider: true,
						definitionProvider: true,
					},
					serverInfo: { name: "cluaupp", version: require("../package.json").version },
				},
			});
			return;
		}
		if (method === "initialized" || method === "shutdown") {
			if (reqId !== undefined) {
				send({ jsonrpc: "2.0", id: reqId, result: null });
			}
			return;
		}
		if (method === "exit") {
			process.exit(0);
		}
		if (method === "textDocument/didOpen") {
			documents.set(params.textDocument.uri, params.textDocument.text);
			publishDiagnostics(params.textDocument.uri);
			return;
		}
		if (method === "textDocument/didChange") {
			const last = params.contentChanges[params.contentChanges.length - 1];
			if (last && last.text !== undefined && !last.range) {
				documents.set(params.textDocument.uri, last.text);
			}
			publishDiagnostics(params.textDocument.uri);
			return;
		}
		if (method === "textDocument/didClose") {
			documents.delete(params.textDocument.uri);
			return;
		}
		if (method === "textDocument/completion") {
			const uri = params.textDocument.uri;
			const text = docText(uri);
			const offset = posToOffset(text, params.position);
			const items = completeAt(text, offset, { projectRoot, file: uriPath(uri) });
			send({
				jsonrpc: "2.0",
				id: reqId,
				result: {
					isIncomplete: false,
					items: items.map((item) => ({
						label: item.name,
						kind: kindNumber(item.kind),
						detail: item.detail,
						sortText: `${item.kind === "keyword" ? "2" : "0"}_${item.name}`,
						insertText: item.name,
					})),
				},
			});
			return;
		}
		if (method === "textDocument/hover") {
			const uri = params.textDocument.uri;
			const text = docText(uri);
			const offset = posToOffset(text, params.position);
			const hover = hoverAt(text, offset, { projectRoot, file: uriPath(uri) });
			send({
				jsonrpc: "2.0",
				id: reqId,
				result: hover
					? { contents: { kind: "markdown", value: `**${hover.name}**\n\n\`${hover.detail || hover.type || ""}\`` } }
					: null,
			});
			return;
		}
		if (method === "textDocument/definition") {
			const uri = params.textDocument.uri;
			const text = docText(uri);
			const offset = posToOffset(text, params.position);
			const def = definitionAt(text, offset, { projectRoot, file: uriPath(uri) });
			if (!def) {
				send({ jsonrpc: "2.0", id: reqId, result: null });
				return;
			}
			send({
				jsonrpc: "2.0",
				id: reqId,
				result: {
					uri: "file:///" + String(def.file).replace(/\\/g, "/"),
					range: {
						start: { line: Math.max(0, (def.line || 1) - 1), character: 0 },
						end: { line: Math.max(0, (def.line || 1) - 1), character: 0 },
					},
				},
			});
			return;
		}
		if (reqId !== undefined) {
			send({ jsonrpc: "2.0", id: reqId, result: null });
		}
		id += 1;
	};

	process.stdin.on("data", (chunk) => {
		buffer = Buffer.concat([buffer, chunk]);
		let parsed = readMessage(buffer);
		while (parsed) {
			handle(parsed.message);
			buffer = parsed.rest;
			parsed = readMessage(buffer);
		}
	});
}

module.exports = { start };
