import { FLARE_IDENT, FLARE_TYPE_ALIASES } from "./parse.js";
import type { FlarePacket, FlareQuery, FlareSide, FlareType } from "./types.js";

export type FlareSeverity = "error" | "warning" | "hint";

export type FlareDiagnostic = {
	line: number;
	start: number;
	end: number;
	message: string;
	severity: FlareSeverity;
};

export type FlareCompletionKind = "keyword" | "type" | "snippet" | "value" | "field";

export type FlareCompletion = {
	label: string;
	kind: FlareCompletionKind;
	detail: string;
	documentation: string;
	insertText: string;
	snippet: boolean;
	sortText: string;
};

export type FlareHover = {
	contents: string;
	start: number;
	end: number;
};

export type FlareSymbol = {
	name: string;
	detail: string;
	kind: "packet" | "query" | "option";
	line: number;
	start: number;
	end: number;
};

export type FlareSignature = {
	label: string;
	documentation: string;
	parameters: { label: string; documentation: string }[];
	activeParameter: number;
};

export type FlareAnalysis = {
	name: string;
	packets: FlarePacket[];
	queries: FlareQuery[];
	diagnostics: FlareDiagnostic[];
};

const IDENT_RE = new RegExp(`^${FLARE_IDENT}$`);
const WORD_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

export const FLARE_CANONICAL_TYPES: FlareType[] = [
	"u8",
	"u16",
	"u32",
	"i8",
	"i16",
	"i32",
	"f32",
	"f64",
	"bool",
	"string",
	"Vector3",
	"Vector2",
	"CFrame",
	"Color3",
	"UDim",
	"UDim2",
	"BrickColor",
	"buffer",
	"Instance",
	"Player",
];

export const FLARE_TYPE_DOCS: Record<string, string> = {
	u8: "Unsigned 8-bit integer (0–255). Packet/query ids use this.",
	u16: "Unsigned 16-bit integer.",
	u32: "Unsigned 32-bit integer.",
	i8: "Signed 8-bit integer.",
	i16: "Signed 16-bit integer.",
	i32: "Signed 32-bit integer. Alias: `int`.",
	int: "Alias for `i32`.",
	f32: "32-bit float. Alias: `float`.",
	float: "Alias for `f32`.",
	f64: "64-bit float. Aliases: `double`, `number`. Use for `tick()`.",
	double: "Alias for `f64`.",
	number: "Alias for `f64`.",
	bool: "Boolean. Alias: `boolean`.",
	boolean: "Alias for `bool`.",
	string: "UTF-8 string (length-prefixed on the wire).",
	Vector3: "Roblox Vector3 (three f32s).",
	Vector2: "Roblox Vector2 (two f32s).",
	CFrame: "Roblox CFrame.",
	Color3: "Roblox Color3.",
	UDim: "Roblox UDim.",
	UDim2: "Roblox UDim2.",
	BrickColor: "Roblox BrickColor.",
	buffer: "Luau buffer payload.",
	Instance: "Roblox Instance (sidecar array, not packed in the buffer).",
	Player: "Roblox Player instance (sidecar). On `from Server` `Fire`, the first `Player` is the **recipient**, not a schema field.",
};

const TYPE_LABELS = [...new Set([...FLARE_CANONICAL_TYPES, "int", "float", "double", "boolean"])];

function lineRange(text: string, fallback = 0): { start: number; end: number } {
	const start = text.search(/\S/);
	if (start < 0) {
		return { start: fallback, end: Math.max(text.length, fallback + 1) };
	}
	return { start, end: text.length };
}

function tokenRange(text: string, token: string): { start: number; end: number } {
	const start = text.indexOf(token);
	if (start < 0) {
		return lineRange(text);
	}
	return { start, end: start + token.length };
}

function splitLines(source: string): string[] {
	return String(source).replace(/\r\n/g, "\n").split("\n");
}

function isBlank(line: string): boolean {
	const trimmed = line.trim();
	return !trimmed || trimmed.startsWith("#") || trimmed.startsWith("//");
}

function parseFieldsLoose(
	list: string,
	line: number,
	lineText: string,
	diagnostics: FlareDiagnostic[],
): { type: FlareType; name: string }[] {
	const trimmed = list.trim();
	if (!trimmed) {
		return [];
	}
	const fields: { type: FlareType; name: string }[] = [];
	for (const part of trimmed.split(",")) {
		const piece = part.trim();
		if (!piece) {
			continue;
		}
		const match = piece.match(new RegExp(`^(${FLARE_IDENT})\\s+(${FLARE_IDENT})$`));
		if (!match) {
			diagnostics.push({
				line,
				...tokenRange(lineText, piece),
				message: `expected 'Type name' in '${piece}'`,
				severity: "error",
			});
			continue;
		}
		const mapped = FLARE_TYPE_ALIASES[match[1]];
		if (!mapped) {
			const hint = closestType(match[1]);
			diagnostics.push({
				line,
				...tokenRange(lineText, match[1]),
				message: hint ? `unknown type '${match[1]}' — did you mean '${hint}'?` : `unknown type '${match[1]}'`,
				severity: "error",
			});
			continue;
		}
		fields.push({ type: mapped, name: match[2] });
	}
	return fields;
}

function closestType(raw: string): string | null {
	const lower = raw.toLowerCase();
	let best: string | null = null;
	let bestDist = 3;
	for (const label of TYPE_LABELS) {
		const dist = levenshtein(lower, label.toLowerCase());
		if (dist < bestDist) {
			bestDist = dist;
			best = label;
		}
	}
	return best;
}

function levenshtein(a: string, b: string): number {
	if (a === b) {
		return 0;
	}
	const rows = a.length + 1;
	const cols = b.length + 1;
	const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
	for (let i = 0; i < rows; i++) {
		grid[i][0] = i;
	}
	for (let j = 0; j < cols; j++) {
		grid[0][j] = j;
	}
	for (let i = 1; i < rows; i++) {
		for (let j = 1; j < cols; j++) {
			grid[i][j] = Math.min(
				grid[i - 1][j] + 1,
				grid[i][j - 1] + 1,
				grid[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
		}
	}
	return grid[a.length][b.length];
}

function parseSideLoose(raw: string, line: number, lineText: string, diagnostics: FlareDiagnostic[]): FlareSide | null {
	const side = raw.toLowerCase();
	if (side === "client") {
		return "Client";
	}
	if (side === "server") {
		return "Server";
	}
	diagnostics.push({
		line,
		...tokenRange(lineText, raw),
		message: `from must be Client or Server, got '${raw}'`,
		severity: "error",
	});
	return null;
}

export function analyzeFlare(source: string, filePath = "Net.flare", defaultName = "Net"): FlareAnalysis {
	const diagnostics: FlareDiagnostic[] = [];
	const packets: FlarePacket[] = [];
	const queries: FlareQuery[] = [];
	const seen = new Map<string, { line: number; kind: string }>();
	let name = defaultName;
	let packetId = 1;
	let queryId = 1;
	const lines = splitLines(source);

	for (let i = 0; i < lines.length; i++) {
		const lineText = lines[i];
		const line = lineText.trim();
		if (isBlank(lineText)) {
			continue;
		}

		const opt = line.match(/^opt\s+name\s*=\s*(.+)$/i);
		if (opt) {
			const value = opt[1].trim().replace(/^["']|["']$/g, "");
			if (!IDENT_RE.test(value)) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, opt[1].trim()),
					message: "opt name must be an identifier",
					severity: "error",
				});
				continue;
			}
			name = value;
			continue;
		}

		if (/^opt\b/i.test(line)) {
			diagnostics.push({
				line: i,
				...lineRange(lineText),
				message: "expected `opt name = Net`",
				severity: "error",
			});
			continue;
		}

		const packet = line.match(
			new RegExp(
				`^packet\\s+(${FLARE_IDENT})\\s*\\((.*)\\)\\s+from\\s+(${FLARE_IDENT})(?:\\s+(${FLARE_IDENT}))?\\s*$`,
				"i",
			),
		);
		if (packet) {
			const from = parseSideLoose(packet[3], i, lineText, diagnostics);
			const reliability = packet[4];
			if (reliability && !/^(unreliable|reliable)$/i.test(reliability)) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, reliability),
					message: `expected unreliable or reliable, got '${reliability}'`,
					severity: "error",
				});
			}
			if (packetId > 255) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, packet[1]),
					message: "too many packets (max 255)",
					severity: "error",
				});
				continue;
			}
			const fields = parseFieldsLoose(packet[2], i, lineText, diagnostics);
			if (!from) {
				continue;
			}
			const dup = seen.get(packet[1]);
			if (dup) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, packet[1]),
					message: `duplicate ${dup.kind} '${packet[1]}'`,
					severity: "error",
				});
				continue;
			}
			seen.set(packet[1], { line: i, kind: "packet" });
			packets.push({
				kind: "packet",
				name: packet[1],
				id: packetId++,
				from,
				reliable: String(reliability || "reliable").toLowerCase() !== "unreliable",
				fields,
			});
			continue;
		}

		const query = line.match(
			new RegExp(`^query\\s+(${FLARE_IDENT})\\s*\\((.*)\\)\\s*->\\s*(${FLARE_IDENT})\\s*$`, "i"),
		);
		if (query) {
			if (queryId > 255) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, query[1]),
					message: "too many queries (max 255)",
					severity: "error",
				});
				continue;
			}
			const returns = FLARE_TYPE_ALIASES[query[3]];
			if (!returns) {
				const hint = closestType(query[3]);
				diagnostics.push({
					line: i,
					...tokenRange(lineText, query[3]),
					message: hint ? `unknown type '${query[3]}' — did you mean '${hint}'?` : `unknown type '${query[3]}'`,
					severity: "error",
				});
			}
			const request = parseFieldsLoose(query[2], i, lineText, diagnostics);
			const dup = seen.get(query[1]);
			if (dup) {
				diagnostics.push({
					line: i,
					...tokenRange(lineText, query[1]),
					message: `duplicate ${dup.kind} '${query[1]}'`,
					severity: "error",
				});
				continue;
			}
			if (!returns) {
				continue;
			}
			seen.set(query[1], { line: i, kind: "query" });
			queries.push({
				kind: "query",
				name: query[1],
				id: queryId++,
				request,
				returns,
			});
			continue;
		}

		diagnostics.push({
			line: i,
			...lineRange(lineText),
			message: "expected packet Tag(Type name, ...) from Client|Server or query Tag(...) -> Type",
			severity: "error",
		});
	}

	if (packets.length === 0 && queries.length === 0) {
		diagnostics.push({
			line: 0,
			start: 0,
			end: Math.max(lines[0]?.length ?? 1, 1),
			message: "schema is empty — add a packet or query",
			severity: lines.some((line) => !isBlank(line)) ? "error" : "hint",
		});
	}

	return { name, packets, queries, diagnostics };
}

export function diagnoseFlare(source: string, filePath?: string): FlareDiagnostic[] {
	return analyzeFlare(source, filePath).diagnostics;
}

function fieldList(fields: { type: string; name: string }[]): string {
	return fields.map((field) => `${field.type} ${field.name}`).join(", ");
}

function packetApi(packet: FlarePacket, ns: string): string {
	const args = fieldList(packet.fields);
	if (packet.from === "Client") {
		return [
			`**packet ${packet.name}** \`${args}\` from Client${packet.reliable ? "" : " unreliable"}`,
			"",
			`Generated \`${ns}.${packet.name}\`:`,
			"- Client: `FireServer(...)`",
			"- Server: `Connect` — first arg is `Player`",
		].join("\n");
	}
	return [
		`**packet ${packet.name}** \`${args}\` from Server${packet.reliable ? "" : " unreliable"}`,
		"",
		`Generated \`${ns}.${packet.name}\`:`,
		"- Server: `Fire(recipient, …fields)` / `FireAll(…fields)`",
		"- Client: `Connect` — fields only, no recipient",
	].join("\n");
}

function queryApi(query: FlareQuery, ns: string): string {
	return [
		`**query ${query.name}** \`${fieldList(query.request)}\` -> ${query.returns}`,
		"",
		`Generated \`${ns}.${query.name}\`:`,
		"- Client: `Invoke(...)`",
		"- Server: `On` — first arg is `Player`, **return** the result",
	].join("\n");
}

function keywordDocs(word: string): string | null {
	const table: Record<string, string> = {
		opt: "`opt name = Net` — generated module / header name.",
		name: "Identifier written by `cluaupp build` (`Net.clh`, `Net.Hit`, …).",
		packet: "One-way remote. `from Client` = FireServer; `from Server` = Fire / FireAll.",
		query: "RPC. Client `Invoke`, server `On` must return the result type.",
		from: "`from Client` or `from Server` — who **sends** the packet.",
		Client: "The client sends. Server `Connect` receives `Player` first.",
		Server: "The server sends. `Fire(player, …)` first arg is the recipient.",
		unreliable: "Unreliable datagram (no ordering/retry). Server-origin sparks, not money.",
		reliable: "Default. Ordered, retried. Keep currency off this channel.",
	};
	return table[word] ?? null;
}

function wordAt(lineText: string, character: number): { word: string; start: number; end: number } | null {
	WORD_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = WORD_RE.exec(lineText))) {
		const start = match.index;
		const end = start + match[0].length;
		if (character >= start && character <= end) {
			return { word: match[0], start, end };
		}
	}
	return null;
}

export function hoverAt(source: string, line: number, character: number): FlareHover | null {
	const lines = splitLines(source);
	const lineText = lines[line] ?? "";
	const found = wordAt(lineText, character);
	if (!found) {
		return null;
	}
	const analysis = analyzeFlare(source);
	const packet = analysis.packets.find((item) => item.name === found.word);
	if (packet) {
		return { contents: packetApi(packet, analysis.name), start: found.start, end: found.end };
	}
	const query = analysis.queries.find((item) => item.name === found.word);
	if (query) {
		return { contents: queryApi(query, analysis.name), start: found.start, end: found.end };
	}
	const typeDoc = FLARE_TYPE_DOCS[found.word];
	if (typeDoc) {
		const canon = FLARE_TYPE_ALIASES[found.word] ?? found.word;
		return { contents: `**${found.word}**${canon !== found.word ? ` → \`${canon}\`` : ""}\n\n${typeDoc}`, start: found.start, end: found.end };
	}
	const keyword = keywordDocs(found.word);
	if (keyword) {
		return { contents: keyword, start: found.start, end: found.end };
	}
	return null;
}

function item(
	label: string,
	kind: FlareCompletionKind,
	detail: string,
	documentation: string,
	insertText = label,
	snippet = false,
	sortText?: string,
): FlareCompletion {
	return { label, kind, detail, documentation, insertText, snippet, sortText: sortText ?? label };
}

function typeItems(): FlareCompletion[] {
	return TYPE_LABELS.map((label, index) =>
		item(label, "type", FLARE_TYPE_ALIASES[label] ?? label, FLARE_TYPE_DOCS[label] ?? "", label, false, `t${String(index).padStart(2, "0")}`),
	);
}

const SNIPPETS: FlareCompletion[] = [
	item(
		"packet (from Client)",
		"snippet",
		"Client → server packet",
		"FireServer on the client; Connect on the server with Player first.",
		"packet ${1:Hit}(${2:Player} ${3:target}, ${4:i32} ${5:damage}) from Client",
		true,
		"0packetc",
	),
	item(
		"packet (from Server)",
		"snippet",
		"Server → client packet",
		"Fire(recipient, …fields) / FireAll. Client Connect sees fields only.",
		"packet ${1:Welcome}(${2:i32} ${3:userId}, ${4:f64} ${5:clock}) from Server",
		true,
		"0packets",
	),
	item(
		"packet (unreliable)",
		"snippet",
		"Unreliable server packet",
		"No retry. Visual sparks, not economy.",
		"packet ${1:Spark}(${2:Vector3} ${3:pos}) from Server unreliable",
		true,
		"0packetu",
	),
	item(
		"query",
		"snippet",
		"RPC query",
		"Client Invoke; server On returns the result.",
		"query ${1:Session}() -> ${2:i32}",
		true,
		"0query",
	),
	item("opt name", "snippet", "Generated module name", "Writes Net.clh / Net.luau.", "opt name = ${1:Net}", true, "0opt"),
];

function insideParens(text: string): boolean {
	const open = text.lastIndexOf("(");
	const close = text.lastIndexOf(")");
	return open >= 0 && open > close;
}

function lastParamFragment(text: string): string {
	const open = text.lastIndexOf("(");
	if (open < 0) {
		return "";
	}
	const inner = text.slice(open + 1);
	const parts = inner.split(",");
	return (parts[parts.length - 1] ?? "").trim();
}

export function completionsAt(source: string, line: number, character: number): FlareCompletion[] {
	const lines = splitLines(source);
	const lineText = lines[line] ?? "";
	const before = lineText.slice(0, character);
	const text = before.trimStart();

	if (!text) {
		return [
			item("packet", "keyword", "One-way remote", keywordDocs("packet") ?? "", "packet "),
			item("query", "keyword", "RPC", keywordDocs("query") ?? "", "query "),
			item("opt", "keyword", "Module name", keywordDocs("opt") ?? "", "opt name = Net"),
			...SNIPPETS,
		];
	}

	if (/^opt(\s+\w*)?$/i.test(text)) {
		return [item("name", "field", "opt name = Net", keywordDocs("name") ?? "")];
	}

	if (/^opt\s+name\s*$/i.test(text)) {
		return [item("=", "keyword", "opt name = Net", "Assign the generated identifier.", "= Net")];
	}

	if (/\bfrom\s+(Client|Server)\s+\w*$/i.test(text)) {
		return [
			item("unreliable", "keyword", "Unreliable datagram", keywordDocs("unreliable") ?? ""),
			item("reliable", "keyword", "Ordered retry (default)", keywordDocs("reliable") ?? ""),
		];
	}

	if (/\bfrom\s+\w*$/i.test(text)) {
		return [
			item("Client", "value", "from Client", keywordDocs("Client") ?? ""),
			item("Server", "value", "from Server", keywordDocs("Server") ?? ""),
		];
	}

	if (/^packet\b.*\)\s+$/i.test(text) || /^packet\b.*\)\s+\w*$/i.test(text)) {
		return [item("from", "keyword", "from Client | Server", keywordDocs("from") ?? "", "from ")];
	}

	if (/->\s*\w*$/.test(text)) {
		return typeItems();
	}

	if ((/^packet\b/i.test(text) || /^query\b/i.test(text)) && insideParens(text)) {
		const fragment = lastParamFragment(text);
		if (!fragment) {
			return typeItems();
		}
		const bits = fragment.split(/\s+/);
		if (bits.length === 1) {
			const mapped = FLARE_TYPE_ALIASES[bits[0]];
			if (mapped) {
				return [
					item("name", "field", "Field identifier", "Second token is the field name (`i32 damage`).", "${1:value}", true),
				];
			}
			return typeItems();
		}
		return [];
	}

	if (/^packet\s+$/i.test(text) || /^query\s+$/i.test(text)) {
		return [];
	}

	return SNIPPETS.filter((snippet) => snippet.label.toLowerCase().includes(text.toLowerCase().split(/\s+/)[0] ?? ""));
}

export function symbolsIn(source: string): FlareSymbol[] {
	const analysis = analyzeFlare(source);
	const lines = splitLines(source);
	const symbols: FlareSymbol[] = [];
	if (analysis.name) {
		const optLine = lines.findIndex((line) => /^\s*opt\s+name\s*=/i.test(line));
		if (optLine >= 0) {
			symbols.push({
				name: analysis.name,
				detail: "opt name",
				kind: "option",
				line: optLine,
				...lineRange(lines[optLine]),
			});
		}
	}
	for (const packet of analysis.packets) {
		const line = lines.findIndex((row) => new RegExp(`^\\s*packet\\s+${packet.name}\\b`).test(row));
		if (line < 0) {
			continue;
		}
		symbols.push({
			name: packet.name,
			detail: `from ${packet.from}${packet.reliable ? "" : " unreliable"}`,
			kind: "packet",
			line,
			...tokenRange(lines[line], packet.name),
		});
	}
	for (const query of analysis.queries) {
		const line = lines.findIndex((row) => new RegExp(`^\\s*query\\s+${query.name}\\b`).test(row));
		if (line < 0) {
			continue;
		}
		symbols.push({
			name: query.name,
			detail: `-> ${query.returns}`,
			kind: "query",
			line,
			...tokenRange(lines[line], query.name),
		});
	}
	return symbols;
}

export function signatureAt(source: string, line: number, character: number): FlareSignature | null {
	const lines = splitLines(source);
	const lineText = lines[line] ?? "";
	const before = lineText.slice(0, character);
	const packet = before.match(/packet\s+(\w+)\s*\(([^)]*)$/i);
	const query = before.match(/query\s+(\w+)\s*\(([^)]*)$/i);
	const match = packet || query;
	if (!match) {
		return null;
	}
	const inner = match[2] ?? "";
	const activeParameter = inner.split(",").length - 1;
	return {
		label: `${packet ? "packet" : "query"} ${match[1]}(Type name, …)`,
		documentation: packet
			? "Each field is `Type name`. Then `from Client` or `from Server`."
			: "Each field is `Type name`. Then `-> Type` for the return.",
		parameters: [
			{ label: "Type name", documentation: "Wire type then identifier, e.g. `i32 damage`." },
			{ label: "…", documentation: "More fields separated by commas." },
		],
		activeParameter: Math.max(0, activeParameter),
	};
}

export function isFlareDocument(uri: string): boolean {
	return /\.flare$/i.test(uri.split("?")[0] ?? "");
}
