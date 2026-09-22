const HEADER =
	/^(?:const function |function )([A-Za-z0-9_]+)(?::([A-Za-z0-9_]+))?\(([^)]*)\)[^\n]*\n/gm;

const INSTANCE_TYPES = new Set([
	"Instance",
	"Part",
	"BasePart",
	"Model",
	"Player",
	"ScreenGui",
	"GuiObject",
	"TextButton",
	"TextLabel",
	"ImageLabel",
	"Frame",
	"Tool",
	"Humanoid",
	"Folder",
	"ValueBase",
	"IntValue",
	"StringValue",
	"BoolValue",
]);

type Param = { name: string; type: string };

function parseParams(sig: string): Param[] {
	const out: Param[] = [];
	for (const piece of String(sig).split(",")) {
		const match = piece.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/);
		if (match) {
			out.push({ name: match[1], type: match[2] });
		}
	}
	return out;
}

function connectRoots(body: string): string[] {
	const roots: string[] = [];
	const seen = new Set<string>();
	const re = /__janitor:Add\(([A-Za-z_][A-Za-z0-9_]*)/g;
	let match: RegExpExecArray | null = re.exec(body);
	while (match) {
		const name = match[1];
		if (!seen.has(name)) {
			seen.add(name);
			roots.push(name);
		}
		match = re.exec(body);
	}
	return roots;
}

function linkTarget(params: Param[], body: string): string | null {
	const roots = connectRoots(body);
	for (const root of roots) {
		const param = params.find((item) => item.name === root && INSTANCE_TYPES.has(item.type));
		if (param) {
			return param.name;
		}
	}
	const fallback = params.find((item) => INSTANCE_TYPES.has(item.type));
	return fallback ? fallback.name : null;
}

function splitSelfGuard(body: string): { guard: string; rest: string } {
	const match = body.match(/^(\tif not \(self[\s\S]*?\n\tend\n)/);
	if (!match) {
		return { guard: "", rest: body };
	}
	return { guard: match[1], rest: body.slice(match[1].length) };
}

function hoistSelf(): string {
	return [
		"\tlocal __janitor = self.janitor",
		"\tif not __janitor then",
		"\t\t__janitor = Janitor.new()",
		"\t\tself.janitor = __janitor",
		"\tend",
		"",
	].join("\n");
}

function hoistLink(name: string): string {
	return ["\tlocal __janitor = Janitor.new()", `\t__janitor:LinkToInstance(${name})`, ""].join("\n");
}

function hoistModule(): string {
	return [
		"\tif not __cluauppSweep then",
		"\t\t__cluauppSweep = Janitor.new()",
		"\tend",
		"\tlocal __janitor = __cluauppSweep",
		"",
	].join("\n");
}

function rewriteBody(params: string, body: string, isMethod: boolean): { body: string; moduleSweep: boolean } {
	if (!/^[ \t]*local __janitor = Janitor\.new\(\)\s*\n/m.test(body)) {
		return { body, moduleSweep: false };
	}
	if (/__janitor:LinkToInstance\(/.test(body)) {
		return { body, moduleSweep: false };
	}
	const stripped = body.replace(/^[ \t]*local __janitor = Janitor\.new\(\)\s*\n/m, "");
	const parsed = parseParams(params);
	const link = linkTarget(parsed, stripped);
	if (link) {
		const pieces = splitSelfGuard(stripped);
		return { body: `${pieces.guard}${hoistLink(link)}${pieces.rest}`, moduleSweep: false };
	}
	if (isMethod) {
		const pieces = splitSelfGuard(stripped);
		return { body: `${pieces.guard}${hoistSelf()}${pieces.rest}`, moduleSweep: false };
	}
	const pieces = splitSelfGuard(stripped);
	return { body: `${pieces.guard}${hoistModule()}${pieces.rest}`, moduleSweep: true };
}

export function rewriteSweepJanitor(luau: string): string {
	const source = String(luau);
	HEADER.lastIndex = 0;
	const matches = [...source.matchAll(HEADER)];
	if (matches.length === 0) {
		return source;
	}

	let out = source.slice(0, matches[0].index);
	let needsModule = false;
	for (let i = 0; i < matches.length; i += 1) {
		const match = matches[i];
		const header = match[0];
		const method = match[2];
		const params = match[3] || "";
		const isMethod = Boolean(method);
		const bodyStart = (match.index || 0) + header.length;
		const bodyEnd = i + 1 < matches.length ? (matches[i + 1].index as number) : source.length;
		const rawBody = source.slice(bodyStart, bodyEnd);
		const rewritten = rewriteBody(params, rawBody, isMethod);
		if (rewritten.moduleSweep) {
			needsModule = true;
		}
		out += header + rewritten.body;
	}

	if (needsModule && !/\blocal __cluauppSweep\b/.test(out)) {
		const inject = "local __cluauppSweep = nil\n";
		if (/const Janitor = require[^\n]*\n/.test(out)) {
			out = out.replace(/const Janitor = require[^\n]*\n/, (line) => `${line}${inject}`);
		} else {
			out = inject + out;
		}
	}
	return out;
}
