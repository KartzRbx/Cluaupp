const CPP_KEYWORDS = new Set([
	"async", "auto", "await", "bool", "break", "case", "catch", "char", "const", "continue", "default",
	"delete", "do", "double", "else", "enum", "explicit", "export", "extern", "false", "float",
	"for", "friend", "func", "goto", "guard", "if", "include", "inline", "int", "long", "match", "namespace", "new",
	"null", "nullptr", "observable", "once", "parallel", "pragma", "private", "protected", "public", "return", "short", "signed",
	"signal", "sizeof", "spawn", "static", "string", "struct", "switch", "template", "this", "true", "try",
	"typedef", "typename", "union", "unsigned", "using", "virtual", "void", "volatile", "while",
	"array", "dictionary", "post", "report", "warn",
]);

const LUAU_KEYWORDS = new Set([
	"and", "break", "const", "do", "else", "elseif", "end", "export", "false", "for", "function",
	"if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "type", "until",
	"while",
]);

const TYPE_NAMES = new Set([
	"Attach3D", "Axes", "BasePart", "BillboardGui", "BindableEvent", "BoolValue", "BrickColor",
	"Camera", "CFrame", "ClickDetector", "Cmdr", "Color3", "ColorSequence", "CombatConfig", "Content", "DataModel",
	"Data", "DataService", "DataServiceOptions", "DataStoreService", "DateTime", "Enum", "Folder", "Font", "FormatNumber", "Frame", "Fusion",
	"GuiObject", "Humanoid", "ImageLabel", "InputObject", "Instance", "IntValue", "Iris", "Janitor", "Lighting",
	"LocalScript", "Model", "ModuleScript", "Mouse", "Net", "NetEvent", "NumberSequence", "NumberValue", "Part",
	"PathWaypoint", "Player", "PlayerGui", "Players", "Promise", "ProximityPrompt", "Random",
	"Ray", "RaycastParams", "RaycastResult", "Rect", "Region3", "RemoteEvent", "ReplicatedStorage",
	"RunService", "ScreenGui", "Script", "ScrollingFrame", "ServerStorage", "Sound", "SpawnLocation",
	"StringValue", "TemplateData", "TextBox", "TextButton", "TextLabel", "Tool", "TweenInfo", "TweenService",
	"Twinkle", "UDim", "UDim2", "UICorner", "UIListLayout", "UIPadding", "UIStroke", "UserInputService",
	"Vector2", "Vector2int16", "Vector3", "Vector3int16", "ViewportFrame", "Workspace",
	"LuaArray", "LeaderstatsServer", "PlayerData", "PlayerDataCurrencies", "PlayerDataInventory",
	"FusionScope", "FusionState", "FusionKey", "React", "ReactElement", "ReactRef", "Vide", "VideState",
	"CoinsLabel", "Icon", "EzVisualz", "StickyBillboard", "Iris",
]);

const BUILTIN_FNS = new Set([
	"GetService", "print", "warn", "error", "assert", "typeof", "tonumber", "tostring", "require", "wait", "task",
	"post", "report", "string_concat", "createElement", "createRef", "mount",
]);

export function escapeHtml(text: string) {
	return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function decodeEntities(html: string) {
	return String(html)
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&");
}

export function visibleText(html: string) {
	return decodeEntities(String(html).replace(/<[^>]+>/g, ""));
}

function tokenSpan(kind: string, text: string) {
	return `<span data-tok="${kind}">${escapeHtml(text)}</span>`;
}

function highlightCode(text: string, lang: string) {
	const keywords = lang === "luau" ? LUAU_KEYWORDS : CPP_KEYWORDS;
	let out = "";
	let last = 0;
	const re = /\b(\d+(?:\.\d+)?)|\b([A-Za-z_][A-Za-z0-9_]*)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text))) {
		out += escapeHtml(text.slice(last, match.index));
		if (match[1]) {
			out += tokenSpan("number", match[1]);
		} else {
			const ident = match[2];
			const call = /^\s*\(/.test(text.slice(match.index + ident.length));
			const afterArrow = /->\s*$/.test(text.slice(0, match.index));
			let kind = "";
			if (keywords.has(ident)) {
				kind = "keyword";
			} else if (TYPE_NAMES.has(ident) && !afterArrow) {
				kind = "type";
			} else if (BUILTIN_FNS.has(ident) || call) {
				kind = "fn";
			}
			out += kind ? tokenSpan(kind, ident) : escapeHtml(ident);
		}
		last = match.index + match[0].length;
	}
	return out + escapeHtml(text.slice(last));
}

export function highlight(source: string, lang = "cpp") {
	const text = String(source);
	if (lang === "plain" || text === "") {
		return escapeHtml(text);
	}
	const parts: { type: string; text: string }[] = [];
	const pattern =
		lang === "luau"
			? /(\-\-[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g
			: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g;
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(text))) {
		if (match.index > last) {
			parts.push({ type: "code", text: text.slice(last, match.index) });
		}
		parts.push({ type: match[1] ? "comment" : "string", text: match[0] });
		last = match.index + match[0].length;
	}
	if (last < text.length) {
		parts.push({ type: "code", text: text.slice(last) });
	}
	const html = parts
		.map((part) => {
			if (part.type === "comment") {
				return tokenSpan("comment", part.text);
			}
			if (part.type === "string") {
				return tokenSpan("string", part.text);
			}
			return highlightCode(part.text, lang);
		})
		.join("");
	if (visibleText(html) !== text) {
		throw new Error("highlighter would leak markup into visible code");
	}
	return html;
}

export function preCode(source: string, lang = "cpp") {
	return `<pre data-lang="${lang}" data-highlighted="1">${highlight(source, lang)}</pre>`;
}
