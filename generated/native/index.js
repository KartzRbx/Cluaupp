"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileAxiomSchema = exports.compileHiveSchema = exports.compileShiftSchema = exports.compileHelmSchema = exports.compileBloomSchema = exports.compileMintSchema = void 0;
exports.isNativeSchemaFile = isNativeSchemaFile;
exports.collectNativeSchemaFiles = collectNativeSchemaFiles;
exports.compileNativeSchemaFile = compileNativeSchemaFile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const IDENT = "[A-Za-z_][A-Za-z0-9_]*";
function fail(file, line, message) {
    throw new Error(`cluaupp schema: ${file}:${line}: ${message}`);
}
function headerBanner(kind) {
    return `// cluaupp generated — do not edit. Change the .${kind} schema and run cluaupp build.\n#pragma once\n`;
}
function luauBanner() {
    return `--!native\n--!optimize 2\n-- cluaupp generated — do not edit.\n`;
}
function posixRel(from, file) {
    return node_path_1.default.relative(from, file).replace(/\\/g, "/");
}
function emitPaths(rel, stem) {
    const relDir = node_path_1.default.posix.dirname(rel);
    const dir = relDir === "." ? "" : relDir;
    const headerRel = dir ? `${dir}/${stem}.clh` : `${stem}.clh`;
    const luauRel = dir ? `${dir}/${stem}.luau` : `${stem}.luau`;
    return { headerRel, luauRel };
}
function isNativeSchemaFile(fileName) {
    const ext = node_path_1.default.extname(fileName).toLowerCase();
    return [".mint", ".bloom", ".helm", ".shift", ".hive", ".axiom"].includes(ext);
}
function collectNativeSchemaFiles(dir, files = []) {
    if (!node_fs_1.default.existsSync(dir)) {
        return files;
    }
    for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
        const full = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectNativeSchemaFiles(full, files);
        }
        else if (isNativeSchemaFile(entry.name)) {
            files.push(full);
        }
    }
    return files;
}
function parseOptName(source, file, defaultName) {
    let name = defaultName;
    const lines = [];
    const raw = String(source).replace(/\r\n/g, "\n").split("\n");
    for (let i = 0; i < raw.length; i++) {
        const lineNo = i + 1;
        const line = raw[i].trim();
        if (!line || line.startsWith("#") || line.startsWith("//")) {
            continue;
        }
        const opt = line.match(/^opt\s+name\s*=\s*(.+)$/i);
        if (opt) {
            const value = opt[1].trim().replace(/^["']|["']$/g, "");
            if (!new RegExp(`^${IDENT}$`).test(value)) {
                fail(file, lineNo, "opt name must be an identifier");
            }
            name = value;
            continue;
        }
        lines.push(`${lineNo}\t${line}`);
    }
    return { name, lines };
}
function compileMint(source, file, defaultName, dir) {
    const { name, lines } = parseOptName(source, file, defaultName);
    if (lines.length === 0) {
        fail(file, 1, "schema is empty — add a formatter");
    }
    const formatters = [];
    for (const tagged of lines) {
        const [lineNoRaw, line] = tagged.split("\t");
        const lineNo = Number(lineNoRaw);
        const match = line.match(new RegExp(`^formatter\\s+(${IDENT})\\s+(compact|group|integer|percent|scientific)(?:\\s*\\((.*)\\))?(?:\\s+fraction\\s+(\\d+))?(?:\\s+grouping\\s+(on|off))?\\s*$`, "i"));
        if (!match) {
            fail(file, lineNo, `expected formatter Name compact("K","M") fraction 1`);
        }
        const suffixes = match[3]
            ? match[3]
                .split(",")
                .map((part) => part.trim().replace(/^["']|["']$/g, ""))
                .filter(Boolean)
            : ["K", "M", "B", "T"];
        formatters.push({
            name: match[1],
            kind: match[2].toLowerCase(),
            suffixes,
            fraction: match[4] ? Number(match[4]) : 1,
            grouping: (match[5] || "on").toLowerCase() !== "off",
        });
    }
    const { headerRel, luauRel } = emitPaths(file, name);
    const header = `${headerBanner("mint")}
namespace ${name} {
${formatters.map((item) => `\tstring ${item.name}(double value);`).join("\n")}
}
`;
    const fns = formatters
        .map((item) => {
        if (item.kind === "compact") {
            const table = item.suffixes.map((suffix, index) => `\t\t{ ${10 ** ((index + 1) * 3)}, "${suffix}" }`).join(",\n");
            return `function ${name}.${item.name}(value: number): string
	return Mint.Compact(value, {
		Fraction = ${item.fraction},
		Suffixes = {
${table}
		},
	})
end`;
        }
        if (item.kind === "percent") {
            return `function ${name}.${item.name}(value: number): string
	return Mint.Percent(value, ${item.fraction})
end`;
        }
        if (item.kind === "integer") {
            return `function ${name}.${item.name}(value: number): string
	return Mint.Group(value, 0)
end`;
        }
        return `function ${name}.${item.name}(value: number): string
	return Mint.Group(value, ${item.fraction})
end`;
    })
        .join("\n\n");
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Mint = require(ReplicatedStorage.CluauppLibs.Mint)
local ${name} = {}

${fns}

return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
function parseBloomGradient(body, file, lineNo) {
    const speedMatch = body.match(/\bspeed\s+([0-9.]+)\b/i);
    const speed = speedMatch ? Number(speedMatch[1]) : 0.4;
    const grad = body.match(/\bgradient((?:\s+[0-9.]+\s+#[0-9A-Fa-f]{6})+)/i);
    if (!grad) {
        fail(file, lineNo, `expected preset Shine { gradient 0 #FFC832 ... }`);
    }
    const stops = [];
    for (const pair of grad[1].trim().matchAll(/([0-9.]+)\s+(#[0-9A-Fa-f]{6})/g)) {
        stops.push({ t: Number(pair[1]), hex: pair[2] });
    }
    if (stops.length === 0) {
        fail(file, lineNo, `expected preset Shine { gradient 0 #FFC832 ... }`);
    }
    return { stops, speed };
}
function compileBloom(source, file, defaultName) {
    const { name, lines } = parseOptName(source, file, defaultName);
    if (lines.length === 0) {
        fail(file, 1, "schema is empty — add a preset");
    }
    const presets = [];
    for (let i = 0; i < lines.length; i++) {
        const [lineNoRaw, line] = lines[i].split("\t");
        const lineNo = Number(lineNoRaw);
        const inline = line.match(new RegExp(`^preset\\s+(${IDENT})\\s+gradient((?:\\s+[0-9.]+\\s+#[0-9A-Fa-f]{6})+)(?:\\s+speed\\s+([0-9.]+))?\\s*$`));
        if (inline) {
            presets.push({
                name: inline[1],
                ...parseBloomGradient(`gradient${inline[2]}${inline[3] ? ` speed ${inline[3]}` : ""}`, file, lineNo),
            });
            continue;
        }
        const blockOpen = line.match(new RegExp(`^preset\\s+(${IDENT})\\s*\\{(.*)$`, "i"));
        if (blockOpen) {
            let body = blockOpen[2];
            if (!body.includes("}")) {
                i += 1;
                while (i < lines.length) {
                    const inner = lines[i].split("\t").slice(1).join("\t");
                    if (inner.includes("}")) {
                        body += ` ${inner.replace(/\}.*$/, "")}`;
                        break;
                    }
                    body += ` ${inner}`;
                    i += 1;
                }
            }
            else {
                body = body.replace(/\}.*$/, "");
            }
            presets.push({ name: blockOpen[1], ...parseBloomGradient(body, file, lineNo) });
            continue;
        }
        fail(file, lineNo, `expected preset Shine { gradient 0 #FFC832 ... }`);
    }
    if (presets.length === 0 || presets.some((item) => item.stops.length === 0)) {
        fail(file, 1, "schema is empty — add a preset with gradient stops");
    }
    const { headerRel, luauRel } = emitPaths(file, name);
    const header = `${headerBanner("bloom")}
#include <clpp/libs/bloom.clh>
namespace ${name} {
${presets.map((item) => `\tBloomHandle ${item.name}(GuiObject target);`).join("\n")}
}
`;
    const fns = presets
        .map((item) => {
        const keys = item.stops
            .map((stop) => `\t\tColorSequenceKeypoint.new(${stop.t}, Color3.fromHex("${stop.hex}"))`)
            .join(",\n");
        return `function ${name}.${item.name}(target: GuiObject)
	return Bloom.Play(target, Bloom.Shine, {
		Speed = ${item.speed},
		Gradient = ColorSequence.new({
${keys}
		}),
	})
end`;
    })
        .join("\n\n");
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Bloom = require(ReplicatedStorage.CluauppLibs.Bloom)
local ${name} = {}

${fns}

return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
function compileHelm(source, file, defaultName) {
    const { name, lines } = parseOptName(source, file, defaultName);
    if (lines.length === 0) {
        fail(file, 1, "schema is empty — add a command");
    }
    const commands = [];
    let id = 1;
    for (const tagged of lines) {
        const [lineNoRaw, line] = tagged.split("\t");
        const lineNo = Number(lineNoRaw);
        const match = line.match(new RegExp(`^command\\s+(${IDENT})\\s*\\((.*)\\)\\s*(?:permission\\s+(${IDENT}))?\\s*$`, "i"));
        if (!match) {
            fail(file, lineNo, `expected command Give(Player target, i32 amount) permission Admin`);
        }
        const args = [];
        if (match[2].trim()) {
            for (const part of match[2].split(",")) {
                const piece = part.trim().match(new RegExp(`^(${IDENT})\\s+(${IDENT})$`));
                if (!piece) {
                    fail(file, lineNo, `expected Type name in '${part}'`);
                }
                args.push({ type: piece[1], name: piece[2] });
            }
        }
        commands.push({ name: match[1], args, permission: match[3] || "Admin" });
        id += 1;
    }
    const { headerRel, luauRel } = emitPaths(file, name);
    const headerCmds = commands
        .map((cmd, index) => `\t// command ${cmd.name} permission ${cmd.permission}\n\tconst int ${cmd.name} = ${index + 1};`)
        .join("\n");
    const header = `${headerBanner("helm")}
#include <clpp/libs/helm.clh>
namespace ${name} {
${headerCmds}
	HelmSession Open(Player player);
}
`;
    const rows = commands
        .map((cmd, index) => {
        const argNames = cmd.args.map((arg) => arg.name).join(", ");
        return `\t${cmd.name} = { Id = ${index + 1}, Permission = "${cmd.permission}", Args = { ${cmd.args
            .map((arg) => `{ Type = "${arg.type}", Name = "${arg.name}" }`)
            .join(", ")} } },`;
    })
        .join("\n");
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Helm = require(ReplicatedStorage.CluauppLibs.Helm)
local ${name} = {
${rows}
}

function ${name}.Open(player: Player)
	return Helm.Open(player, ${name})
end

return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
function compileShift(source, file, defaultName) {
    const { name, lines } = parseOptName(source, file, defaultName);
    const states = [];
    const parents = {};
    const transitions = [];
    for (const tagged of lines) {
        const [lineNoRaw, line] = tagged.split("\t");
        const lineNo = Number(lineNoRaw);
        const state = line.match(new RegExp(`^state\\s+(${IDENT})(?:\\s+parent\\s+(${IDENT}))?\\s*$`, "i"));
        if (state) {
            states.push(state[1]);
            if (state[2]) {
                parents[state[1]] = state[2];
            }
            continue;
        }
        const edge = line.match(new RegExp(`^(${IDENT})\\s*->\\s*(${IDENT})(?:\\s+when\\s+(${IDENT}))?\\s*$`));
        if (edge) {
            transitions.push({ from: edge[1], to: edge[2], guard: edge[3] || "" });
            continue;
        }
        const machine = line.match(new RegExp(`^machine\\s+(${IDENT})\\s*$`, "i"));
        if (machine) {
            continue;
        }
        fail(file, lineNo, `expected state Idle or Idle -> Chase when SeePlayer`);
    }
    if (states.length === 0) {
        fail(file, 1, "schema is empty — add a state");
    }
    if (states.length > 255) {
        fail(file, 1, "too many states (max 255)");
    }
    const { headerRel, luauRel } = emitPaths(file, name);
    const header = `${headerBanner("shift")}
#include <clpp/libs/shift.clh>
namespace ${name} {
${states.map((state, index) => `\tconst int ${state} = ${index};`).join("\n")}
	ShiftMachine New();
}
`;
    const ids = states.map((state, index) => `\t${state} = ${index},`).join("\n");
    const edges = transitions
        .map((edge) => `\t{ From = "${edge.from}", To = "${edge.to}", Guard = "${edge.guard}" },`)
        .join("\n");
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shift = require(ReplicatedStorage.CluauppLibs.Shift)
local ${name} = {
	Ids = {
${ids}
	},
	Parents = {
${Object.entries(parents)
        .map(([child, parent]) => `\t\t${child} = "${parent}",`)
        .join("\n")}
	},
	Transitions = {
${edges}
	},
}

function ${name}.New()
	return Shift.New(${name}.Ids, ${name}.Transitions, ${name}.Parents)
end

return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
function compileHive(source, file, defaultName) {
    const { name, lines } = parseOptName(source, file, defaultName);
    const components = [];
    for (const tagged of lines) {
        const [lineNoRaw, line] = tagged.split("\t");
        const lineNo = Number(lineNoRaw);
        const match = line.match(new RegExp(`^component\\s+(${IDENT})\\s*\\{(.*)\\}\\s*$`, "i"));
        if (!match) {
            fail(file, lineNo, `expected component Health { i32 current, i32 max }`);
        }
        const fields = [];
        if (match[2].trim()) {
            for (const part of match[2].split(",")) {
                const piece = part.trim().match(new RegExp(`^(${IDENT})\\s+(${IDENT})$`));
                if (!piece) {
                    fail(file, lineNo, `expected Type name in '${part}'`);
                }
                fields.push({ type: piece[1], name: piece[2] });
            }
        }
        components.push({ name: match[1], fields });
    }
    if (components.length === 0) {
        fail(file, 1, "schema is empty — add a component");
    }
    if (components.length > 255) {
        fail(file, 1, "too many components (max 255)");
    }
    const { headerRel, luauRel } = emitPaths(file, name);
    const header = `${headerBanner("hive")}
#include <clpp/libs/hive.clh>
namespace ${name} {
${components.map((item, index) => `\tconst int ${item.name} = ${index + 1};`).join("\n")}
	auto New();
}
`;
    const rows = components
        .map((item, index) => `\t${item.name} = { Id = ${index + 1}, Fields = { ${item.fields
        .map((field) => `{ Type = "${field.type}", Name = "${field.name}" }`)
        .join(", ")} } },`)
        .join("\n");
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Hive = require(ReplicatedStorage.CluauppLibs.Hive)
local ${name} = {
${rows}
}

function ${name}.New()
	return Hive.World(${name})
end

return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
/** Mirrors Axiom.Groups + axiom.clh prototypes for IntelliSense on selected namespaces. */
const AXIOM_GROUP_DECLS = {
    Scalar: [
        "double Clamp(double value, double min, double max);",
        "double Map(double value, double inMin, double inMax, double outMin, double outMax);",
        "double Wrap(double value, double min, double max);",
        "double Sign(double value);",
        "double Round(double value);",
        "double Round(double value, int digits);",
        "double Snap(double value, double step);",
        "double PingPong(double t, double length);",
        "double Saturate(double value);",
        "double Fract(double value);",
        "double InvLerp(double from, double to, double value);",
        "double Approach(double current, double target, double maxDelta);",
        "bool IsFinite(double value);",
        "double Abs(double value);",
        "double Min(double a, double b);",
        "double Max(double a, double b);",
        "double Pow(double base, double exp);",
        "double Sqrt(double value);",
        "double Cbrt(double value);",
        "double Hypot(double a, double b);",
        "double Log(double value);",
        "double Exp(double value);",
        "double Smoothstep(double edge0, double edge1, double x);",
        "double Smootherstep(double edge0, double edge1, double x);",
        "double Gcd(double a, double b);",
        "double Lcm(double a, double b);",
        "bool IsEven(double value);",
        "bool IsOdd(double value);",
        "double Factorial(double n);",
        "double Scale(double value, int index);",
    ],
    Lerp: [
        "double Lerp(double from, double to, double alpha);",
        "double LerpClamped(double from, double to, double alpha);",
        "Vector2 LerpVector2(Vector2 from, Vector2 to, double alpha);",
        "Vector3 LerpVector3(Vector3 from, Vector3 to, double alpha);",
        "Vector3 LerpVector(Vector3 from, Vector3 to, double alpha);",
        "Color3 LerpColor3(Color3 from, Color3 to, double alpha);",
        "CFrame LerpCFrame(CFrame from, CFrame to, double alpha);",
        "UDim2 LerpUDim2(UDim2 from, UDim2 to, double alpha);",
        "double LerpAngle(double from, double to, double alpha);",
        "double Inverse(double from, double to, double value);",
    ],
    Vector: [
        "Vector3 Project(Vector3 a, Vector3 b);",
        "Vector3 Reject(Vector3 a, Vector3 b);",
        "Vector3 Reflect(Vector3 incident, Vector3 normal);",
        "double Angle(Vector3 a, Vector3 b);",
        "double Distance(Vector3 a, Vector3 b);",
        "double Distance2(Vector2 a, Vector2 b);",
        "CFrame Orthonormal(Vector3 forward);",
        "CFrame Orthonormal(Vector3 forward, Vector3 up);",
        "Vector3 Slerp(Vector3 a, Vector3 b, double t);",
        "CFrame LookAt(Vector3 from, Vector3 look);",
    ],
    CFrame: ["CFrame SlerpCFrame(CFrame a, CFrame b, double t);", "CFrame Flat(CFrame cf);"],
    Easing: [
        "double InSine(double t);",
        "double OutSine(double t);",
        "double InOutSine(double t);",
        "double InQuad(double t);",
        "double OutQuad(double t);",
        "double InOutQuad(double t);",
        "double InCubic(double t);",
        "double OutCubic(double t);",
        "double InOutCubic(double t);",
        "double InQuart(double t);",
        "double OutQuart(double t);",
        "double InOutQuart(double t);",
        "double InQuint(double t);",
        "double OutQuint(double t);",
        "double InOutQuint(double t);",
        "double InExpo(double t);",
        "double OutExpo(double t);",
        "double InOutExpo(double t);",
        "double InCirc(double t);",
        "double OutCirc(double t);",
        "double InOutCirc(double t);",
        "double InBack(double t);",
        "double OutBack(double t);",
        "double InOutBack(double t);",
        "double InElastic(double t);",
        "double OutElastic(double t);",
        "double InOutElastic(double t);",
        "double InBounce(double t);",
        "double OutBounce(double t);",
        "double InOutBounce(double t);",
        "double Linear(double t);",
    ],
    Bezier: [
        "Vector3 CubicBezier(double t, Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3);",
        "Vector3 QuadraticBezier(double t, Vector3 p0, Vector3 p1, Vector3 p2);",
        "CFrame Hover(double elapsed, Vector3 anchor, Vector3 look);",
        "CFrame Float(double elapsed, Vector3 anchor, Vector3 look);",
        "CFrame FloatSpin(double elapsed, CFrame anchor);",
    ],
    Geometry: [
        "bool AabbContains(Vector3 point, Vector3 min, Vector3 max);",
        "bool SphereContains(Vector3 point, Vector3 center, double radius);",
        "Vector3 RayPlane(Vector3 origin, Vector3 dir, Vector3 point, Vector3 normal);",
        "Vector3 Barycentric(Vector3 p, Vector3 a, Vector3 b, Vector3 c);",
        "Vector3 ClosestPointOnSegment(Vector3 p, Vector3 a, Vector3 b);",
    ],
    Trig: [
        "double Deg(double rad);",
        "double Rad(double deg);",
        "double DeltaAngle(double from, double to);",
        "double AngleDiff(double from, double to);",
        "double DeltaAngleDegrees(double from, double to);",
        "double NormalizeAngle(double angle);",
        "double Sin(double x);",
        "double Cos(double x);",
        "double Tan(double x);",
        "double Asin(double x);",
        "double Acos(double x);",
        "double Atan2(double y, double x);",
    ],
    Probability: [
        "double RandomRange(double min, double max);",
        "double Random(double min, double max);",
        "int Weighted(LuaArray<double> weights);",
        "double Gaussian();",
        "double Gaussian(double mean, double std);",
        "double Average(LuaArray<double> values);",
        "double Sum(LuaArray<double> values);",
    ],
    Noise: [
        "double HashU32(double n);",
        "double Value1(double x);",
        "double Value2(double x, double y);",
        "double Value3(double x, double y, double z);",
    ],
    Color: [
        "Color3 FromHSV(double h, double s, double v);",
        "Color3 Contrast(Color3 color, double amount);",
        "Color3 LerpHSV(Color3 a, Color3 b, double t);",
    ],
};
function axiomFnDecls() {
    const byFn = {};
    for (const decls of Object.values(AXIOM_GROUP_DECLS)) {
        for (const decl of decls) {
            const match = decl.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
            if (!match) {
                continue;
            }
            const fn = match[1];
            if (!byFn[fn]) {
                byFn[fn] = [];
            }
            byFn[fn].push(decl);
        }
    }
    return byFn;
}
const AXIOM_FN_DECLS = axiomFnDecls();
function axiomHeaderBody(groups, fns, file, lineNo) {
    const decls = [];
    const seen = new Set();
    const pushDecl = (decl) => {
        if (seen.has(decl)) {
            return;
        }
        seen.add(decl);
        decls.push(`\t${decl}`);
    };
    for (const group of groups) {
        const key = Object.keys(AXIOM_GROUP_DECLS).find((name) => name.toLowerCase() === group.toLowerCase());
        if (!key) {
            fail(file, lineNo, `unknown group "${group}" — use Scalar Lerp Vector CFrame Easing Bezier Geometry Trig Probability Noise Color`);
        }
        decls.push(`\t// group ${key}`);
        for (const decl of AXIOM_GROUP_DECLS[key]) {
            pushDecl(decl);
        }
    }
    for (const fn of fns) {
        const key = Object.keys(AXIOM_FN_DECLS).find((name) => name.toLowerCase() === fn.toLowerCase());
        if (!key) {
            fail(file, lineNo, `unknown fn "${fn}" — use a name from axiom.clh (e.g. fn LerpVector2)`);
        }
        decls.push(`\t// fn ${key}`);
        for (const decl of AXIOM_FN_DECLS[key]) {
            pushDecl(decl);
        }
    }
    return decls.join("\n");
}
function compileAxiom(source, file, defaultName) {
    const { name, lines } = parseOptName(source, file, defaultName);
    const groups = [];
    const fns = [];
    let lastLine = 1;
    for (const tagged of lines) {
        const [lineNoRaw, line] = tagged.split("\t");
        const lineNo = Number(lineNoRaw);
        lastLine = lineNo;
        const groupMatch = line.match(new RegExp(`^group\\s+(${IDENT})\\s*$`, "i"));
        if (groupMatch) {
            groups.push(groupMatch[1]);
            continue;
        }
        const fnMatch = line.match(new RegExp(`^fn\\s+(${IDENT})\\s*$`, "i"));
        if (fnMatch) {
            fns.push(fnMatch[1]);
            continue;
        }
        fail(file, lineNo, `expected group Lerp or fn LerpVector2`);
    }
    if (groups.length === 0 && fns.length === 0) {
        fail(file, 1, "schema is empty — add group Lerp or fn LerpVector2");
    }
    const body = axiomHeaderBody(groups, fns, file, lastLine);
    const selectArgs = [...groups, ...fns].map((item) => `"${item}"`).join(", ");
    const { headerRel, luauRel } = emitPaths(file, name);
    const header = `${headerBanner("axiom")}
#include <clpp/libs/axiom.clh>
namespace ${name} {
${body}
}
`;
    const luau = `${luauBanner()}local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Axiom = require(ReplicatedStorage.CluauppLibs.Axiom)
local ${name} = Axiom.Select({ ${selectArgs} })
-- out/ binds: ${[...groups.map((g) => `group ${g}`), ...fns.map((f) => `fn ${f}`)].join(", ")}
return ${name}
`;
    return { headerRel, headerPath: headerRel, header, luauRel, luau };
}
function compileNativeSchemaFile(file, srcDir) {
    const source = node_fs_1.default.readFileSync(file, "utf8");
    const rel = posixRel(srcDir, file);
    const stem = node_path_1.default.basename(file, node_path_1.default.extname(file));
    const ext = node_path_1.default.extname(file).toLowerCase();
    const dir = node_path_1.default.posix.dirname(rel);
    if (ext === ".mint") {
        return compileMint(source, rel, stem, dir);
    }
    if (ext === ".bloom") {
        return compileBloom(source, rel, stem);
    }
    if (ext === ".helm") {
        return compileHelm(source, rel, stem);
    }
    if (ext === ".shift") {
        return compileShift(source, rel, stem);
    }
    if (ext === ".hive") {
        return compileHive(source, rel, stem);
    }
    if (ext === ".axiom") {
        return compileAxiom(source, rel, stem);
    }
    throw new Error(`cluaupp schema: unknown extension ${ext}`);
}
exports.compileMintSchema = compileMint;
exports.compileBloomSchema = compileBloom;
exports.compileHelmSchema = compileHelm;
exports.compileShiftSchema = compileShift;
exports.compileHiveSchema = compileHive;
exports.compileAxiomSchema = compileAxiom;
