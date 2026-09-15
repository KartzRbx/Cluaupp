"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DUMP = path.join(ROOT, "data", "Mini-API-Dump.json");
const INCLUDE = path.join(ROOT, "include", "cluaupp");
const SITE = path.join(ROOT, "..", "site");

const CPP_RESERVED = new Set([
	"alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor", "bool", "break",
	"case", "catch", "char", "class", "compl", "concept", "const", "consteval", "constexpr",
	"const_cast", "continue", "co_await", "co_return", "co_yield", "decltype", "default",
	"delete", "do", "double", "dynamic_cast", "else", "enum", "explicit", "export", "extern",
	"false", "float", "for", "friend", "goto", "if", "inline", "int", "long", "mutable",
	"namespace", "new", "noexcept", "not", "not_eq", "nullptr", "operator", "or", "or_eq",
	"private", "protected", "public", "register", "reinterpret_cast", "requires", "return",
	"short", "signed", "sizeof", "static", "static_assert", "static_cast", "struct", "switch",
	"template", "this", "thread_local", "throw", "true", "try", "typedef", "typeid", "typename",
	"union", "unsigned", "using", "virtual", "void", "volatile", "wchar_t", "xor", "xor_eq",
	"NULL", "string",
]);

const DATATYPE_SPEC = [
	{
		name: "Vector3",
		summary: "3D point or direction. Luau: Vector3.new(x, y, z).",
		fields: ["double X", "double Y", "double Z", "double Magnitude", "Vector3 Unit"],
		ctors: [[], ["double x", "double y", "double z"]],
		statics: ["zero", "one", "xAxis", "yAxis", "zAxis"],
		staticMethods: [
			["FromNormalId", "Vector3", ["NormalId normal"]],
			["FromAxis", "Vector3", ["Axis axis"]],
		],
		methods: [
			["Abs", "Vector3", []],
			["Ceil", "Vector3", []],
			["Floor", "Vector3", []],
			["Sign", "Vector3", []],
			["Cross", "Vector3", ["Vector3 other"]],
			["Dot", "double", ["Vector3 other"]],
			["Lerp", "Vector3", ["Vector3 goal", "double alpha"]],
			["Max", "Vector3", ["Vector3 other"]],
			["Min", "Vector3", ["Vector3 other"]],
			["FuzzyEq", "bool", ["Vector3 other", "double epsilon"]],
			["Angle", "double", ["Vector3 other"]],
		],
	},
	{
		name: "Vector2",
		summary: "2D point or direction. Luau: Vector2.new(x, y).",
		fields: ["double X", "double Y", "double Magnitude", "Vector2 Unit"],
		ctors: [[], ["double x", "double y"]],
		statics: ["zero", "one", "xAxis", "yAxis"],
		methods: [
			["Abs", "Vector2", []],
			["Ceil", "Vector2", []],
			["Floor", "Vector2", []],
			["Sign", "Vector2", []],
			["Cross", "double", ["Vector2 other"]],
			["Dot", "double", ["Vector2 other"]],
			["Lerp", "Vector2", ["Vector2 goal", "double alpha"]],
			["Max", "Vector2", ["Vector2 other"]],
			["Min", "Vector2", ["Vector2 other"]],
			["FuzzyEq", "bool", ["Vector2 other", "double epsilon"]],
			["Angle", "double", ["Vector2 other"]],
		],
	},
	{
		name: "Vector3int16",
		summary: "Vector3 with 16-bit integers.",
		fields: ["int X", "int Y", "int Z"],
		ctors: [[], ["int x", "int y", "int z"]],
	},
	{
		name: "Vector2int16",
		summary: "Vector2 with 16-bit integers.",
		fields: ["int X", "int Y"],
		ctors: [[], ["int x", "int y"]],
	},
	{
		name: "CFrame",
		summary: "3D position + rotation. Luau: CFrame.new(...) / CFrame.lookAt(...).",
		fields: [
			"Vector3 Position",
			"CFrame Rotation",
			"Vector3 LookVector",
			"Vector3 RightVector",
			"Vector3 UpVector",
			"Vector3 XVector",
			"Vector3 YVector",
			"Vector3 ZVector",
		],
		ctors: [
			[],
			["double x", "double y", "double z"],
			["Vector3 pos"],
			["Vector3 pos", "Vector3 lookAt"],
			["double x", "double y", "double z", "double qX", "double qY", "double qZ", "double qW"],
		],
		statics: ["identity"],
		staticMethods: [
			["lookAt", "CFrame", ["Vector3 from", "Vector3 lookAt", "Vector3 up"]],
			["lookAlong", "CFrame", ["Vector3 from", "Vector3 direction", "Vector3 up"]],
			["fromEulerAngles", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromEulerAnglesXYZ", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromEulerAnglesYXZ", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromOrientation", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromAxisAngle", "CFrame", ["Vector3 axis", "double angle"]],
			["fromMatrix", "CFrame", ["Vector3 pos", "Vector3 vX", "Vector3 vY", "Vector3 vZ"]],
		],
		methods: [
			["Inverse", "CFrame", []],
			["Lerp", "CFrame", ["CFrame goal", "double alpha"]],
			["Orthonormalize", "CFrame", []],
			["ToWorldSpace", "CFrame", ["CFrame cf"]],
			["ToObjectSpace", "CFrame", ["CFrame cf"]],
			["PointToWorldSpace", "Vector3", ["Vector3 v"]],
			["PointToObjectSpace", "Vector3", ["Vector3 v"]],
			["VectorToWorldSpace", "Vector3", ["Vector3 v"]],
			["VectorToObjectSpace", "Vector3", ["Vector3 v"]],
			["GetComponents", "void", []],
			["ToEulerAnglesXYZ", "void", []],
			["ToEulerAnglesYXZ", "void", []],
			["ToOrientation", "void", []],
			["ToAxisAngle", "void", []],
			["FuzzyEq", "bool", ["CFrame other", "double epsilon"]],
		],
	},
	{
		name: "UDim",
		summary: "1D scale + offset (GUI). Luau: UDim.new(scale, offset).",
		fields: ["double Scale", "double Offset"],
		ctors: [[], ["double scale", "double offset"]],
	},
	{
		name: "UDim2",
		summary: "2D scale + offset (GUI). Luau: UDim2.new / UDim2.fromScale / UDim2.fromOffset.",
		fields: ["UDim X", "UDim Y", "UDim Width", "UDim Height"],
		ctors: [[], ["double xScale", "double xOffset", "double yScale", "double yOffset"], ["UDim x", "UDim y"]],
		staticMethods: [
			["fromScale", "UDim2", ["double x", "double y"]],
			["fromOffset", "UDim2", ["double x", "double y"]],
		],
		methods: [["Lerp", "UDim2", ["UDim2 goal", "double alpha"]]],
	},
	{
		name: "Color3",
		summary: "RGB color 0–1. Luau: Color3.new / Color3.fromRGB / Color3.fromHSV / Color3.fromHex.",
		fields: ["double R", "double G", "double B"],
		ctors: [[], ["double r", "double g", "double b"]],
		staticMethods: [
			["fromRGB", "Color3", ["double r", "double g", "double b"]],
			["fromHSV", "Color3", ["double h", "double s", "double v"]],
			["fromHex", "Color3", ["string hex"]],
		],
		methods: [
			["Lerp", "Color3", ["Color3 goal", "double alpha"]],
			["ToHSV", "void", []],
			["ToHex", "string", []],
		],
	},
	{
		name: "BrickColor",
		summary: "Named Roblox color. BrickColor.new(name) or BrickColor.new(r,g,b).",
		fields: ["int Number", "string Name", "Color3 Color", "double r", "double g", "double b"],
		ctors: [["string name"], ["int palette"], ["double r", "double g", "double b"], ["Color3 color"]],
		statics: ["White", "Gray", "DarkGray", "Black", "Red", "Yellow", "Green", "Blue"],
		staticMethods: [
			["palette", "BrickColor", ["int index"]],
			["random", "BrickColor", []],
		],
	},
	{
		name: "Rect",
		summary: "2D rectangle. Rect.new(min, max) or Rect.new(x0,y0,x1,y1).",
		fields: ["Vector2 Min", "Vector2 Max", "double Width", "double Height"],
		ctors: [["Vector2 min", "Vector2 max"], ["double x0", "double y0", "double x1", "double y1"]],
	},
	{
		name: "Ray",
		summary: "3D ray. Ray.new(origin, direction).",
		fields: ["Vector3 Origin", "Vector3 Direction", "Ray Unit"],
		ctors: [["Vector3 origin", "Vector3 direction"]],
		methods: [
			["ClosestPoint", "Vector3", ["Vector3 point"]],
			["Distance", "double", ["Vector3 point"]],
		],
	},
	{
		name: "RaycastParams",
		summary: "Filters for WorldRoot:Raycast.",
		fields: ["Instance* FilterDescendantsInstances", "RaycastFilterType FilterType", "bool IgnoreWater", "string CollisionGroup", "bool RespectCanCollide", "bool BruteForceAllSlow"],
		ctors: [[]],
	},
	{
		name: "RaycastResult",
		summary: "Result of a raycast.",
		fields: ["Instance* Instance", "Vector3 Position", "Vector3 Normal", "double Distance", "string Material"],
	},
	{
		name: "OverlapParams",
		summary: "Filters for GetPartBoundsInBox / GetPartsInPart.",
		fields: ["Instance* FilterDescendantsInstances", "RaycastFilterType FilterType", "int MaxParts", "string CollisionGroup", "bool RespectCanCollide", "bool BruteForceAllSlow"],
		ctors: [[]],
	},
	{
		name: "NumberRange",
		summary: "Numeric interval. NumberRange.new(min, max).",
		fields: ["double Min", "double Max"],
		ctors: [["double value"], ["double min", "double max"]],
	},
	{
		name: "NumberSequence",
		summary: "Number curve over time (0–1).",
		fields: ["NumberSequenceKeypoint* Keypoints"],
		ctors: [["double value"], ["double n0", "double n1"]],
	},
	{
		name: "NumberSequenceKeypoint",
		fields: ["double Time", "double Value", "double Envelope"],
		ctors: [["double time", "double value"], ["double time", "double value", "double envelope"]],
	},
	{
		name: "ColorSequence",
		summary: "Color3 curve over time.",
		fields: ["ColorSequenceKeypoint* Keypoints"],
		ctors: [["Color3 color"], ["Color3 c0", "Color3 c1"]],
	},
	{
		name: "ColorSequenceKeypoint",
		fields: ["double Time", "Color3 Value", "double Envelope"],
		ctors: [["double time", "Color3 color"]],
	},
	{
		name: "TweenInfo",
		summary: "Parameters for TweenService:Create.",
		fields: ["double Time", "EasingStyle EasingStyle", "EasingDirection EasingDirection", "int RepeatCount", "bool Reverses", "double DelayTime"],
		ctors: [
			[],
			["double time"],
			["double time", "EasingStyle style"],
			["double time", "EasingStyle style", "EasingDirection direction"],
			["double time", "EasingStyle style", "EasingDirection direction", "int repeatCount", "bool reverses", "double delayTime"],
		],
	},
	{
		name: "Font",
		summary: "UI font. Font.new(family, weight, style).",
		fields: ["string Family", "FontWeight Weight", "FontStyle Style", "bool Bold"],
		ctors: [["string family"], ["string family", "FontWeight weight", "FontStyle style"]],
		staticMethods: [
			["fromEnum", "Font", ["Font enumFont"]],
			["fromName", "Font", ["string name"]],
			["fromId", "Font", ["long long id"]],
		],
	},
	{
		name: "PhysicalProperties",
		summary: "Density, friction, and elasticity of a BasePart.",
		fields: ["double Density", "double Friction", "double Elasticity", "double FrictionWeight", "double ElasticityWeight", "double AcousticAbsorption"],
		ctors: [["Material material"], ["double density", "double friction", "double elasticity"], ["double density", "double friction", "double elasticity", "double frictionWeight", "double elasticityWeight"]],
	},
	{
		name: "Region3",
		summary: "Axis-aligned box. Region3.new(min, max).",
		fields: ["CFrame CFrame", "Vector3 Size"],
		ctors: [["Vector3 min", "Vector3 max"]],
		methods: [["ExpandToGrid", "Region3", ["double resolution"]]],
	},
	{
		name: "Region3int16",
		fields: ["Vector3int16 Min", "Vector3int16 Max"],
		ctors: [["Vector3int16 min", "Vector3int16 max"]],
	},
	{
		name: "DateTime",
		summary: "UTC instant. DateTime.now() / DateTime.fromUnixTimestamp().",
		fields: ["double UnixTimestamp", "double UnixTimestampMillis"],
		staticMethods: [
			["now", "DateTime", []],
			["fromUnixTimestamp", "DateTime", ["double unixTimestamp"]],
			["fromUnixTimestampMillis", "DateTime", ["double unixTimestampMillis"]],
			["fromUniversalTime", "DateTime", ["int year", "int month", "int day", "int hour", "int minute", "int second", "int millisecond"]],
			["fromLocalTime", "DateTime", ["int year", "int month", "int day", "int hour", "int minute", "int second", "int millisecond"]],
			["fromIsoDate", "DateTime", ["string isoDate"]],
		],
		methods: [
			["ToUniversalTime", "void", []],
			["ToLocalTime", "void", []],
			["ToIsoDate", "string", []],
			["FormatUniversalTime", "string", ["string format", "string locale"]],
			["FormatLocalTime", "string", ["string format", "string locale"]],
		],
	},
	{
		name: "Random",
		summary: "RNG. Random.new(seed).",
		ctors: [[], ["double seed"]],
		methods: [
			["NextInteger", "int", ["int min", "int max"]],
			["NextNumber", "double", []],
			["NextUnitVector", "Vector3", []],
			["Clone", "Random", []],
			["Shuffle", "void", []],
		],
	},
	{
		name: "PathWaypoint",
		fields: ["Vector3 Position", "PathWaypointAction Action", "string Label"],
		ctors: [["Vector3 position", "PathWaypointAction action"], ["Vector3 position", "PathWaypointAction action", "string label"]],
	},
	{
		name: "Faces",
		ctors: [[]],
		fields: ["bool Top", "bool Bottom", "bool Left", "bool Right", "bool Front", "bool Back"],
	},
	{
		name: "Axes",
		ctors: [[]],
		fields: ["bool X", "bool Y", "bool Z", "bool Top", "bool Bottom", "bool Left", "bool Right", "bool Front", "bool Back"],
	},
	{
		name: "RBXScriptSignal",
		summary: "Event. playerAdded.Connect(callback) becomes signal:Connect(callback).",
		methods: [
			["Connect", "RBXScriptConnection", ["void (*callback)()"]],
			["Once", "RBXScriptConnection", ["void (*callback)()"]],
			["Wait", "void", []],
			["ConnectParallel", "RBXScriptConnection", ["void (*callback)()"]],
		],
	},
	{
		name: "RBXScriptConnection",
		fields: ["bool Connected"],
		methods: [["Disconnect", "void", []]],
	},
	{
		name: "CatalogSearchParams",
		ctors: [[]],
		fields: ["string SearchKeyword", "int MinPrice", "int MaxPrice", "CatalogSortType SortType", "CatalogSortAggregation SortAggregation", "CatalogCategoryFilter CategoryFilter", "SalesTypeFilter SalesTypeFilter", "int Limit"],
	},
	{
		name: "DockWidgetPluginGuiInfo",
		ctors: [[]],
	},
	{
		name: "FloatCurveKey",
		fields: ["double Time", "double Value", "KeyInterpolationMode Interpolation"],
		ctors: [["double time", "double value"]],
	},
	{
		name: "RotationCurveKey",
		fields: ["double Time", "CFrame Value", "KeyInterpolationMode Interpolation"],
		ctors: [["double time", "CFrame value"]],
	},
	{
		name: "Path2DControlPoint",
		fields: ["UDim2 Position", "UDim2 LeftTangent", "UDim2 RightTangent"],
		ctors: [[]],
	},
	{
		name: "Content",
		summary: "Asset reference (replaces several ContentId uses).",
		ctors: [[]],
		staticMethods: [
			["fromUri", "Content", ["string uri"]],
			["fromAssetId", "Content", ["long long assetId"]],
		],
	},
	{ name: "ContentId", fields: [], ctors: [["string uri"]] },
	{ name: "SharedTable", ctors: [[]] },
	{ name: "Secret", ctors: [[]] },
	{ name: "buffer", ctors: [[]] },
	{ name: "BinaryString", ctors: [[]] },
	{ name: "SharedString", ctors: [[]] },
	{ name: "UniqueId", ctors: [[]] },
	{ name: "ProtectedString", ctors: [[]] },
	{ name: "OptionalCoordinateFrame", ctors: [[]] },
	{ name: "SecurityCapabilities", ctors: [[]] },
];

function ident(name) {
	if (!name) {
		return "value";
	}
	let cleaned = String(name).replace(/[^A-Za-z0-9_]/g, "_");
	if (/^[0-9]/.test(cleaned)) {
		cleaned = "_" + cleaned;
	}
	if (CPP_RESERVED.has(cleaned)) {
		return cleaned + "_";
	}
	return cleaned;
}

function cppType(type) {
	if (!type) {
		return "void";
	}
	const category = type.Category;
	const name = type.Name;
	if (category === "Primitive") {
		const map = {
			bool: "bool",
			string: "string",
			int: "int",
			int64: "long long",
			float: "float",
			double: "double",
			null: "void",
			void: "void",
		};
		return map[name] || "double";
	}
	if (category === "Class") {
		if (!name || name === "void" || name === "nil") {
			return "void";
		}
		return ident(name) + "*";
	}
	if (category === "Enum") {
		return "Enum::" + ident(name);
	}
	if (category === "DataType") {
		if (name === "Function" || name === "Tuple" || name === "Variant" || name === "Array" || name === "Dictionary" || name === "Map") {
			return "void*";
		}
		if (name === "Instances") {
			return "Instance**";
		}
		if (name === "ContentId") {
			return "string";
		}
		return ident(name);
	}
	if (category === "Group") {
		return "void*";
	}
	return "void*";
}

function luauTypeName(type) {
	if (!type) {
		return "()";
	}
	if (type.Category === "Primitive") {
		if (type.Name === "bool") {
			return "boolean";
		}
		if (type.Name === "string") {
			return "string";
		}
		if (type.Name === "null" || type.Name === "void") {
			return "()";
		}
		return "number";
	}
	if (type.Category === "Enum") {
		return "Enum." + type.Name;
	}
	if (type.Category === "Class") {
		return type.Name;
	}
	return type.Name || "any";
}

function tagsOf(item) {
	return Array.isArray(item.Tags) ? item.Tags : [];
}

function isService(cls) {
	return tagsOf(cls).includes("Service");
}

function isCreatable(cls) {
	const tags = tagsOf(cls);
	return !tags.includes("NotCreatable") && !tags.includes("Service") && !tags.includes("Deprecated");
}

function escapeHtml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function mkdirp(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function write(file, contents) {
	mkdirp(path.dirname(file));
	fs.writeFileSync(file, contents, "utf8");
}

function css() {
	return `html{color-scheme:dark}:root{--bg:#0b1220;--panel:#121a2b;--line:#243049;--text:#e7eefc;--muted:#93a0bb;--accent:#3d8bfd;--ok:#5bd6a0}*{box-sizing:border-box}body{margin:0;font:16px/1.55 ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--text)}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}header{padding:20px 28px;border-bottom:1px solid var(--line);background:#0e1626;position:sticky;top:0}header strong{font-size:18px}nav a{margin-right:16px;color:var(--muted)}main{display:grid;grid-template-columns:280px 1fr;min-height:calc(100vh - 64px)}aside{border-right:1px solid var(--line);padding:20px;background:#0e1626;overflow:auto}article{padding:28px 36px;max-width:1100px}.hero{padding:48px 36px;max-width:980px}h1,h2,h3{line-height:1.2}p.muted, .muted{color:var(--muted)}code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}pre{background:var(--panel);border:1px solid var(--line);padding:14px 16px;overflow:auto;border-radius:10px}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border-bottom:1px solid var(--line);text-align:left;padding:8px 10px;vertical-align:top}th{color:var(--muted);font-weight:600}input[type=search]{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--text);margin:0 0 14px}.tag{display:inline-block;border:1px solid var(--line);padding:1px 8px;border-radius:999px;color:var(--muted);font-size:12px;margin-right:6px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.card{display:block;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text)}.card:hover{border-color:var(--accent);text-decoration:none}.crumb{color:var(--muted);margin-bottom:12px}ul.list{list-style:none;padding:0;margin:0}ul.list li{padding:4px 0}`;
}

function layout(title, body, sidebar = "") {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Cluaupp</title>
<link rel="stylesheet" href="/cluaupp/assets/style.css">
</head>
<body>
<header>
  <strong><a href="/cluaupp/">Cluaupp</a></strong>
  <nav>
    <a href="/cluaupp/">Home</a>
    <a href="/cluaupp/guide/getting-started.html">Get started</a>
    <a href="/cluaupp/api/datatypes/">Datatypes</a>
    <a href="/cluaupp/api/classes/">Classes</a>
    <a href="/cluaupp/api/enums/">Enums</a>
    <a href="https://create.roblox.com/docs/reference/engine">Roblox API</a>
  </nav>
</header>
${sidebar ? `<main><aside>${sidebar}</aside><article>${body}</article></main>` : `<div class="hero">${body}</div>`}
</body>
</html>
`;
}

function localLayout(title, body, sidebar, depth) {
	const rel = depth === 0 ? "." : "../".repeat(depth).slice(0, -1) || ".";
	const prefix = depth === 0 ? "./" : "../".repeat(depth);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Cluaupp</title>
<link rel="stylesheet" href="${prefix}assets/style.css">
</head>
<body>
<header>
  <strong><a href="${prefix}index.html">Cluaupp</a></strong>
  <nav>
    <a href="${prefix}index.html">Home</a>
    <a href="${prefix}guide/getting-started.html">Get started</a>
    <a href="${prefix}api/datatypes/index.html">Datatypes</a>
    <a href="${prefix}api/classes/index.html">Classes</a>
    <a href="${prefix}api/enums/index.html">Enums</a>
    <a href="https://create.roblox.com/docs/reference/engine">Roblox API</a>
  </nav>
</header>
${sidebar ? `<main><aside>${sidebar}</aside><article>${body}</article></main>` : `<div class="hero">${body}</div>`}
</body>
</html>
`;
}

function generate() {
	if (!fs.existsSync(DUMP)) {
		throw new Error("API dump not found at " + DUMP);
	}
	const dump = JSON.parse(fs.readFileSync(DUMP, "utf8"));
	const classes = dump.Classes;
	const enums = dump.Enums;
	const byName = new Map(classes.map((cls) => [cls.Name, cls]));

	const datatypeNames = new Set(DATATYPE_SPEC.map((d) => d.name));
	for (const cls of classes) {
		for (const member of cls.Members) {
			const t = member.ValueType || member.ReturnType;
			if (t && t.Category === "DataType" && t.Name) {
				datatypeNames.add(t.Name);
			}
		}
	}

	const instanceTypes = [];
	const services = [];
	const methods = new Set(["Connect", "Once", "Disconnect", "Wait", "GetService"]);
	for (const cls of classes) {
		if (isService(cls)) {
			services.push(cls.Name);
		}
		if (isCreatable(cls) || cls.Name === "Folder" || cls.Name === "Part") {
			instanceTypes.push(cls.Name);
		}
		for (const member of cls.Members) {
			if (member.MemberType === "Function") {
				methods.add(member.Name);
			}
		}
	}
	for (const spec of DATATYPE_SPEC) {
		for (const [name] of spec.methods || []) {
			methods.add(name);
		}
	}

	const generatedApi = `// Generated from Roblox API dump ${dump.Version || ""}
"use strict";
module.exports = {
	INSTANCE_TYPES: ${JSON.stringify(instanceTypes.sort(), null, "\t")},
	SERVICES: ${JSON.stringify(services.sort(), null, "\t")},
	METHODS: ${JSON.stringify([...methods].sort(), null, "\t")},
	DATATYPES: ${JSON.stringify([...datatypeNames].sort(), null, "\t")},
};
`;
	write(path.join(ROOT, "src", "api.generated.js"), generatedApi);

	let enumsHpp = `#pragma once
// Generated from Roblox API dump. Enum.Name.Item → Enum::Name::Item
namespace Enum {
`;
	for (const en of enums) {
		enumsHpp += `\tenum class ${ident(en.Name)} {\n`;
		for (const item of en.Items) {
			enumsHpp += `\t\t${ident(item.Name)} = ${item.Value},\n`;
		}
		enumsHpp += `\t};\n`;
	}
	enumsHpp += `}\n`;
	write(path.join(INCLUDE, "generated", "enums.hpp"), enumsHpp);

	const specNames = new Set(DATATYPE_SPEC.map((d) => d.name));
	let dtHpp = `#pragma once
#include <cluaupp/generated/enums.hpp>
using Enum::EasingStyle;
using Enum::EasingDirection;
using Enum::Material;
using Enum::FontWeight;
using Enum::FontStyle;
using Enum::RaycastFilterType;
using Enum::PathWaypointAction;
using Enum::CatalogSortType;
using Enum::CatalogSortAggregation;
using Enum::CatalogCategoryFilter;
using Enum::SalesTypeFilter;
using Enum::KeyInterpolationMode;
using Enum::NormalId;
using Enum::Axis;

struct Instance;
`;

	function emitDatatype(spec) {
		let out = `\n// ${spec.summary || spec.name}\nstruct ${ident(spec.name)} {\n`;
		for (const field of spec.fields || []) {
			out += `\t${field};\n`;
		}
		for (const ctor of spec.ctors || []) {
			out += `\t${ident(spec.name)}(${ctor.join(", ")});\n`;
		}
		for (const st of spec.statics || []) {
			out += `\tstatic ${ident(spec.name)} ${ident(st)};\n`;
		}
		for (const [name, ret, params] of spec.staticMethods || []) {
			out += `\tstatic ${ret} ${ident(name)}(${(params || []).join(", ")});\n`;
		}
		for (const [name, ret, params] of spec.methods || []) {
			out += `\t${ret} ${ident(name)}(${(params || []).join(", ")});\n`;
		}
		out += `};\n`;
		return out;
	}

	for (const spec of DATATYPE_SPEC) {
		dtHpp += emitDatatype(spec);
	}
	for (const name of [...datatypeNames].sort()) {
		if (!specNames.has(name) && ident(name) !== "Instance") {
			dtHpp += `\nstruct ${ident(name)} {};\n`;
		}
	}
	write(path.join(INCLUDE, "datatypes.hpp"), dtHpp);

	let instHpp = `#pragma once
#include <cluaupp/datatypes.hpp>

`;
	for (const cls of classes) {
		instHpp += `struct ${ident(cls.Name)};\n`;
	}
	instHpp += "\n";

	for (const cls of classes) {
		const superName = cls.Superclass && cls.Superclass !== "<<<ROOT>>>" ? ident(cls.Superclass) : "";
		const parent = superName && byName.has(cls.Superclass) ? ` : ${superName}` : "";
		instHpp += `struct ${ident(cls.Name)}${parent} {\n`;
		if (!parent) {
			instHpp += `\t${ident(cls.Name)}() = default;\n`;
		}
		if (isCreatable(cls)) {
			instHpp += `\t${ident(cls.Name)}(Instance* parent);\n`;
		}
		for (const member of cls.Members) {
			if (member.MemberType === "Property") {
				instHpp += `\t${cppType(member.ValueType)} ${ident(member.Name)};\n`;
			} else if (member.MemberType === "Function") {
				const params = (member.Parameters || [])
					.map((p) => `${cppType(p.Type)} ${ident(p.Name)}`)
					.join(", ");
				instHpp += `\t${cppType(member.ReturnType)} ${ident(member.Name)}(${params});\n`;
			} else if (member.MemberType === "Event") {
				instHpp += `\tRBXScriptSignal ${ident(member.Name)};\n`;
			} else if (member.MemberType === "Callback") {
				instHpp += `\tvoid (*${ident(member.Name)})();\n`;
			}
		}
		instHpp += `};\n\n`;
	}
	write(path.join(INCLUDE, "generated", "instances.hpp"), instHpp);

	const umbrella = `#pragma once
// Cluaupp — full Roblox API for IntelliSense.
// Source: official client dump + datatypes from create.roblox.com
// The compiler ignores #include and emits real Luau (Vector3.new, Instance.new, :GetPlayers, ...).

using string = const char*;

#include <cluaupp/generated/enums.hpp>
#include <cluaupp/datatypes.hpp>
#include <cluaupp/generated/instances.hpp>
#include <cluaupp/libs.hpp>

template <typename T>
T* GetService();

template <typename T>
T* GetService(Instance* game_);

extern DataModel* game;
extern Workspace* workspace;
extern LuaSourceContainer* script;

void print(string message);
void warn(string message);
void error(string message);
double tick();
double time();
void wait(double seconds);
void spawn(void (*callback)());
void delay(double seconds, void (*callback)());

#ifndef nullptr
#define nullptr 0
#endif
`;
	write(path.join(INCLUDE, "roblox.hpp"), umbrella);

	buildSite({ classes, enums, byName, dump, instanceTypes, services });
	const gameInclude = path.join(ROOT, "..", "game", "include", "cluaupp");
	if (fs.existsSync(path.join(ROOT, "..", "game"))) {
		fs.cpSync(INCLUDE, gameInclude, { recursive: true });
	}
	console.log(
		"Generated Cluaupp API:",
		classes.length,
		"classes,",
		enums.length,
		"enums,",
		datatypeNames.size,
		"datatypes,",
		methods.size,
		"methods",
	);
}

function sidebarFor(kind, items, current, prefix) {
	const qid = kind + "-q";
	let html = `<input type="search" id="${qid}" placeholder="Filter ${kind}...">`;
	html += `<ul class="list" id="${kind}-list">`;
	for (const name of items) {
		const href = `${prefix}${name}.html`;
		html += `<li><a href="${href}">${escapeHtml(name)}</a></li>`;
	}
	html += `</ul>
<script>
const q=document.getElementById(${JSON.stringify(qid)});
const list=document.getElementById(${JSON.stringify(kind + "-list")});
if(q&&list){q.addEventListener("input",()=>{const s=q.value.toLowerCase();for(const li of list.children){li.style.display=li.textContent.toLowerCase().includes(s)?"":"none"}})}
</script>`;
	return html;
}

function buildSite({ classes, enums, byName, dump, instanceTypes, services }) {
	mkdirp(path.join(SITE, "assets"));
	mkdirp(path.join(SITE, "api", "classes"));
	mkdirp(path.join(SITE, "api", "datatypes"));
	mkdirp(path.join(SITE, "api", "enums"));
	mkdirp(path.join(SITE, "guide"));
	write(path.join(SITE, "assets", "style.css"), css());

	const indexBody = `
<h1>Cluaupp</h1>
<p>The definitive merge of C++ and modern Luau. Docs generated from the official Roblox API dump (${escapeHtml(String(dump.Version || ""))}) — the same classes, properties, methods, and enums as <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a>.</p>
<pre>npm install -g cluaupp
cluaupp init my-game
cluaupp build
rojo serve</pre>
<div class="grid">
  <a class="card" href="guide/getting-started.html"><strong>Get started</strong><br><span class="muted">install, init, Rojo, IntelliSense</span></a>
  <a class="card" href="api/datatypes/index.html"><strong>Datatypes</strong><br><span class="muted">Vector3, CFrame, UDim, UDim2, Color3…</span></a>
  <a class="card" href="api/classes/index.html"><strong>Classes</strong><br><span class="muted">${classes.length} instances and services</span></a>
  <a class="card" href="api/enums/index.html"><strong>Enums</strong><br><span class="muted">${enums.length} enumerations</span></a>
</div>
<h2>Libraries</h2>
<p class="muted">First-party: Janitor, Promise, Net (buffer remotes), Module3D, Twinkle, MathUtils, FormatNumber. Wally: DataServiceV2, Fusion, Cmdr, EzVisualz, TopbarPlus. C++ headers under <code>#include &lt;cluaupp/libs/…&gt;</code>.</p>
<h2>C++ → Luau</h2>
<table>
<tr><th>C++</th><th>Luau</th></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>CFrame::lookAt(from, look)</code></td><td><code>CFrame.lookAt(from, look)</code></td></tr>
<tr><td><code>UDim2::fromScale(1, 1)</code></td><td><code>UDim2.fromScale(1, 1)</code></td></tr>
<tr><td><code>Color3::fromRGB(255, 0, 0)</code></td><td><code>Color3.fromRGB(255, 0, 0)</code></td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td><code>Enum.Material.Plastic</code></td></tr>
<tr><td><code>new Part(workspace)</code></td><td><code>Instance.new("Part")</code> + <code>.Parent</code></td></tr>
<tr><td><code>part-&gt;Position</code></td><td><code>part.Position</code></td></tr>
<tr><td><code>part-&gt;CFrame</code></td><td><code>part.CFrame</code></td></tr>
<tr><td><code>player-&gt;FindFirstChild("x")</code></td><td><code>player:FindFirstChild("x")</code></td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>new Janitor()</code></td><td><code>Janitor.new()</code></td></tr>
<tr><td><code>Net::Event("Coins")</code></td><td><code>Net.Event("Coins")</code></td></tr>
<tr><td><code>janitor-&gt;Add(conn)</code></td><td><code>janitor:Add(conn)</code></td></tr>
</table>
`;
	write(path.join(SITE, "index.html"), localLayout("Docs", indexBody, "", 0));

	const getting = `
<div class="crumb"><a href="../index.html">Cluaupp</a> / Get started</div>
<h1>Getting started</h1>
<p class="muted">Cluaupp is the definitive merge of C++ and modern Luau (<code>--!strict</code>, <code>local</code>, <code>const</code>) with first-class Roblox APIs.</p>
<h2>Install</h2>
<pre>npm install -g cluaupp
cluaupp init my-game
cd my-game
cluaupp build
rojo serve</pre>
<h2>Datatypes in C++</h2>
<pre>#include &lt;cluaupp/roblox.hpp&gt;

void init() {
  auto* part = new Part(workspace);
  part-&gt;Name = "Platform";
  part-&gt;Size = Vector3(8, 1, 8);
  part-&gt;Position = Vector3(0, 10, 0);
  part-&gt;CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
  part-&gt;Anchored = true;
  part-&gt;BrickColor = BrickColor("Bright red");
  part-&gt;Color = Color3::fromRGB(255, 0, 0);

  auto* gui = new ScreenGui(GetService&lt;Players&gt;()-&gt;LocalPlayer-&gt;FindFirstChild("PlayerGui"));
  auto* frame = new Frame(gui);
  frame-&gt;Size = UDim2::fromScale(1, 1);
  frame-&gt;Position = UDim2(0, 0, 0, 0);
}
</pre>
<p>This becomes <code>Vector3.new</code>, <code>CFrame.lookAt</code>, <code>UDim2.fromScale</code>, <code>Color3.fromRGB</code>, and <code>Instance.new("Part")</code>.</p>
<p>Official reference: <a href="https://create.roblox.com/docs/reference/engine/datatypes">datatypes</a> and <a href="https://create.roblox.com/docs/reference/engine/classes">classes</a>.</p>
`;
	write(path.join(SITE, "guide", "getting-started.html"), localLayout("Get started", getting, "", 2));

	const dtIndex = DATATYPE_SPEC.map(
		(d) => `<a class="card" href="${d.name}.html"><strong>${d.name}</strong><br><span class="muted">${escapeHtml(d.summary || "datatype")}</span></a>`,
	).join("\n");
	write(
		path.join(SITE, "api", "datatypes", "index.html"),
		localLayout("Datatypes", `<h1>Datatypes</h1><p class="muted">Engine value types. In C++ you construct with <code>Vector3(x,y,z)</code>; Cluaupp emits <code>Vector3.new</code>.</p><div class="grid">${dtIndex}</div>`, "", 3),
	);

	const dtNames = DATATYPE_SPEC.map((d) => d.name);
	for (const spec of DATATYPE_SPEC) {
		const official = `https://create.roblox.com/docs/reference/engine/datatypes/${spec.name}`;
		let body = `<div class="crumb"><a href="../../index.html">Cluaupp</a> / <a href="index.html">Datatypes</a> / ${spec.name}</div>`;
		body += `<h1>${spec.name}</h1>`;
		body += `<p>${escapeHtml(spec.summary || "")} Official docs: <a href="${official}">${official}</a></p>`;
		body += `<h2>C++ → Luau</h2><table><tr><th>C++</th><th>Luau</th></tr>`;
		body += `<tr><td><code>${spec.name}(...)</code> or <code>new ${spec.name}(...)</code></td><td><code>${spec.name}.new(...)</code></td></tr>`;
		for (const [name] of spec.staticMethods || []) {
			body += `<tr><td><code>${spec.name}::${name}(...)</code></td><td><code>${spec.name}.${name}(...)</code></td></tr>`;
		}
		for (const st of spec.statics || []) {
			body += `<tr><td><code>${spec.name}::${st}</code></td><td><code>${spec.name}.${st}</code></td></tr>`;
		}
		for (const [name] of spec.methods || []) {
			body += `<tr><td><code>value.${name}(...)</code></td><td><code>value:${name}(...)</code> or <code>value.${name}(...)</code></td></tr>`;
		}
		body += `</table>`;
		if (spec.fields && spec.fields.length) {
			body += `<h2>Fields</h2><table><tr><th>C++</th></tr>`;
			for (const field of spec.fields) {
				body += `<tr><td><code>${escapeHtml(field)}</code></td></tr>`;
			}
			body += `</table>`;
		}
		body += `<h2>Header</h2><p>Include <code>#include &lt;cluaupp/roblox.hpp&gt;</code>. The type lives in <code>include/cluaupp/datatypes.hpp</code>.</p>`;
		write(
			path.join(SITE, "api", "datatypes", spec.name + ".html"),
			localLayout(spec.name, body, sidebarFor("datatypes", dtNames, spec.name, ""), 3),
		);
	}

	const classNames = classes.map((c) => c.Name);
	const classCards = classes
		.map((c) => {
			const tags = tagsOf(c);
			const kind = tags.includes("Service") ? "Service" : tags.includes("NotCreatable") ? "abstract" : "creatable";
			return `<a class="card" href="${c.Name}.html"><strong>${escapeHtml(c.Name)}</strong><br><span class="muted">${kind}${c.Superclass ? " · " + c.Superclass : ""}</span></a>`;
		})
		.join("\n");
	write(
		path.join(SITE, "api", "classes", "index.html"),
		localLayout(
			"Classes",
			`<h1>Classes</h1><p class="muted">${classes.length} classes from the official dump. Each page lists properties, methods, and events, with the C++ / Luau mapping and a Creator Hub link.</p><p>${services.length} services · ${instanceTypes.length} creatable with <code>new Class(parent)</code>.</p><div class="grid">${classCards}</div>`,
			"",
			3,
		),
	);

	for (const cls of classes) {
		const official = `https://create.roblox.com/docs/reference/engine/classes/${cls.Name}`;
		const tags = tagsOf(cls);
		let body = `<div class="crumb"><a href="../../index.html">Cluaupp</a> / <a href="index.html">Classes</a> / ${escapeHtml(cls.Name)}</div>`;
		body += `<h1>${escapeHtml(cls.Name)}</h1>`;
		body += `<p>`;
		if (cls.Superclass && byName.has(cls.Superclass)) {
			body += `Super: <a href="${cls.Superclass}.html">${escapeHtml(cls.Superclass)}</a>. `;
		}
			body += `Official: <a href="${official}">create.roblox.com — ${escapeHtml(cls.Name)}</a></p>`;
		body += tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("") || "";
		if (isCreatable(cls)) {
			body += `<h2>Construct</h2><pre>auto* obj = new ${cls.Name}(parent);
// Instance.new("${cls.Name}")
// obj.Parent = parent</pre>`;
		}
		if (isService(cls)) {
			body += `<h2>Service</h2><pre>auto* svc = GetService&lt;${cls.Name}&gt;();
// game:GetService("${cls.Name}")</pre>`;
		}

		const props = cls.Members.filter((m) => m.MemberType === "Property");
		const fns = cls.Members.filter((m) => m.MemberType === "Function");
		const evs = cls.Members.filter((m) => m.MemberType === "Event");
		const cbs = cls.Members.filter((m) => m.MemberType === "Callback");

		if (props.length) {
			body += `<h2>Properties (${props.length})</h2><table><tr><th>C++</th><th>Luau</th><th>Type</th><th>Tags</th></tr>`;
			for (const p of props) {
				body += `<tr><td><code>${escapeHtml(cls.Name)}::${escapeHtml(p.Name)}</code></td><td><code>obj.${escapeHtml(p.Name)}</code></td><td><code>${escapeHtml(luauTypeName(p.ValueType))}</code></td><td>${escapeHtml((p.Tags || []).join(", "))}</td></tr>`;
			}
			body += `</table>`;
		}
		if (fns.length) {
			body += `<h2>Methods (${fns.length})</h2><table><tr><th>C++</th><th>Luau</th><th>Returns</th></tr>`;
			for (const fn of fns) {
				const params = (fn.Parameters || []).map((p) => p.Name).join(", ");
				body += `<tr><td><code>obj-&gt;${escapeHtml(fn.Name)}(${escapeHtml(params)})</code></td><td><code>obj:${escapeHtml(fn.Name)}(${escapeHtml(params)})</code></td><td><code>${escapeHtml(luauTypeName(fn.ReturnType))}</code></td></tr>`;
			}
			body += `</table>`;
		}
		if (evs.length) {
			body += `<h2>Events (${evs.length})</h2><table><tr><th>C++</th><th>Luau</th></tr>`;
			for (const ev of evs) {
				body += `<tr><td><code>obj-&gt;${escapeHtml(ev.Name)}.Connect(fn)</code></td><td><code>obj.${escapeHtml(ev.Name)}:Connect(fn)</code></td></tr>`;
			}
			body += `</table>`;
		}
		if (cbs.length) {
			body += `<h2>Callbacks</h2><ul>`;
			for (const cb of cbs) {
				body += `<li><code>${escapeHtml(cb.Name)}</code></li>`;
			}
			body += `</ul>`;
		}
		if (!props.length && !fns.length && !evs.length) {
			body += `<p class="muted">No members of its own. See the superclass — the dump lists only what this class adds.</p>`;
		}
		write(
			path.join(SITE, "api", "classes", cls.Name + ".html"),
			localLayout(cls.Name, body, sidebarFor("classes", classNames, cls.Name, ""), 3),
		);
	}

	const enumNames = enums.map((e) => e.Name);
	const enumCards = enums
		.map((e) => `<a class="card" href="${e.Name}.html"><strong>${escapeHtml(e.Name)}</strong><br><span class="muted">${e.Items.length} items</span></a>`)
		.join("\n");
	write(
		path.join(SITE, "api", "enums", "index.html"),
		localLayout("Enums", `<h1>Enums</h1><p class="muted">C++: <code>Enum::Material::Plastic</code>. Luau: <code>Enum.Material.Plastic</code>.</p><div class="grid">${enumCards}</div>`, "", 3),
	);
	for (const en of enums) {
		const official = `https://create.roblox.com/docs/reference/engine/enums/${en.Name}`;
		let body = `<div class="crumb"><a href="../../index.html">Cluaupp</a> / <a href="index.html">Enums</a> / ${escapeHtml(en.Name)}</div>`;
		body += `<h1>Enum.${escapeHtml(en.Name)}</h1>`;
		body += `<p>C++: <code>Enum::${escapeHtml(en.Name)}::Item</code> → Luau: <code>Enum.${escapeHtml(en.Name)}.Item</code>. Official: <a href="${official}">create.roblox.com</a></p>`;
		body += `<table><tr><th>Item</th><th>Value</th><th>C++</th><th>Luau</th></tr>`;
		for (const item of en.Items) {
			body += `<tr><td>${escapeHtml(item.Name)}</td><td>${item.Value}</td><td><code>Enum::${escapeHtml(en.Name)}::${escapeHtml(item.Name)}</code></td><td><code>Enum.${escapeHtml(en.Name)}.${escapeHtml(item.Name)}</code></td></tr>`;
		}
		body += `</table>`;
		write(
			path.join(SITE, "api", "enums", en.Name + ".html"),
			localLayout(en.Name, body, sidebarFor("enums", enumNames, en.Name, ""), 3),
		);
	}
}

generate();
