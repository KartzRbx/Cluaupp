"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DUMP = path.join(ROOT, "data", "Mini-API-Dump.json");
const INCLUDE = path.join(ROOT, "include", "clpp");

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
		fields: ["double X", "double Y", "double Z", "double Magnitude"],
		ctors: [[], ["double x", "double y", "double z"]],
		statics: ["zero", "one", "xAxis", "yAxis", "zAxis"],
		staticMethods: [
			["FromNormalId", "Vector3", ["NormalId normal"]],
			["FromAxis", "Vector3", ["Axis axis"]],
		],
		methods: [
			["Unit", "Vector3", []],
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
		fields: ["double X", "double Y", "double Magnitude"],
		ctors: [[], ["double x", "double y"]],
		statics: ["zero", "one", "xAxis", "yAxis"],
		methods: [
			["Unit", "Vector2", []],
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
			["lookAt", "CFrame", ["Vector3 from", "Vector3 lookAt"]],
			["lookAt", "CFrame", ["Vector3 from", "Vector3 lookAt", "Vector3 up"]],
			["lookAlong", "CFrame", ["Vector3 from", "Vector3 direction"]],
			["lookAlong", "CFrame", ["Vector3 from", "Vector3 direction", "Vector3 up"]],
			["fromEulerAngles", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromEulerAnglesXYZ", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromEulerAnglesYXZ", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromOrientation", "CFrame", ["double rx", "double ry", "double rz"]],
			["fromAxisAngle", "CFrame", ["Vector3 axis", "double angle"]],
			["fromMatrix", "CFrame", ["Vector3 pos", "Vector3 vX", "Vector3 vY", "Vector3 vZ"]],
		],
		methods: [
			["Rotation", "CFrame", []],
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
		fields: ["Vector3 Origin", "Vector3 Direction"],
		ctors: [["Vector3 origin", "Vector3 direction"]],
		methods: [
			["Unit", "Ray", []],
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
		name: "NumberSequenceKeypoint",
		fields: ["double Time", "double Value", "double Envelope"],
		ctors: [["double time", "double value"], ["double time", "double value", "double envelope"]],
	},
	{
		name: "NumberSequence",
		summary: "Number curve over time (0–1).",
		fields: ["NumberSequenceKeypoint* Keypoints"],
		ctors: [["double value"], ["double n0", "double n1"]],
	},
	{
		name: "ColorSequenceKeypoint",
		fields: ["double Time", "Color3 Value", "double Envelope"],
		ctors: [["double time", "Color3 color"]],
	},
	{
		name: "ColorSequence",
		summary: "Color3 curve over time.",
		fields: ["ColorSequenceKeypoint* Keypoints"],
		ctors: [["Color3 color"], ["Color3 c0", "Color3 c1"]],
	},
	{
		name: "TweenInfo",
		summary: "Parameters for TweenService:Create.",
		fields: ["double Time", "Enum::EasingStyle EasingStyle", "Enum::EasingDirection EasingDirection", "int RepeatCount", "bool Reverses", "double DelayTime"],
		ctors: [
			[],
			["double time"],
			["double time", "Enum::EasingStyle style"],
			["double time", "Enum::EasingStyle style", "Enum::EasingDirection direction"],
			["double time", "Enum::EasingStyle style", "Enum::EasingDirection direction", "int repeatCount", "bool reverses", "double delayTime"],
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
		name: "RBXScriptConnection",
		fields: ["bool Connected"],
		methods: [["Disconnect", "void", []]],
	},
	{
		name: "RBXScriptSignal",
		summary: "Event. playerAdded.Connect(callback) becomes signal:Connect(callback).",
		custom: true,
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

function stripTypeName(name) {
	if (!name) {
		return "";
	}
	return String(name).replace(/\?+$/, "");
}

function ident(name) {
	if (!name) {
		return "value";
	}
	let cleaned = stripTypeName(name).replace(/[^A-Za-z0-9_]/g, "_");
	if (/^[0-9]/.test(cleaned)) {
		cleaned = "_" + cleaned;
	}
	if (CPP_RESERVED.has(cleaned)) {
		return cleaned + "_";
	}
	return cleaned;
}

function memberIdent(className, memberName) {
	let id = ident(memberName);
	if (id === ident(className)) {
		return id + "_";
	}
	return id;
}

function cppType(type, memberName) {
	if (!type) {
		return "void";
	}
	const category = type.Category;
	const name = stripTypeName(type.Name);
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
		return ident(name);
	}
	if (category === "Enum") {
		return "Enum::" + ident(name);
	}
	if (category === "DataType") {
		if (name === "Function" || name === "Tuple" || name === "Variant" || name === "Array" || name === "Dictionary" || name === "Map") {
			return "void*";
		}
		if (name === "User") {
			return "long long";
		}
		if (name === "Instances") {
			if (memberName === "GetPlayers" || memberName === "getPlayers" || memberName === "players") {
				return "LuaArray<Player>";
			}
			return "LuaArray<Instance>";
		}
		if (name === "ContentId" || name === "BinaryString" || name === "ProtectedString" || name === "SharedString") {
			return "string";
		}
		return "::" + ident(name);
	}
	if (category === "Group") {
		return "void*";
	}
	return "void*";
}

function isPointerCppType(ty) {
	return ty.endsWith("*") || ty === "string" || ty === "void*";
}

function isNumericCppType(ty) {
	return ty === "int" || ty === "float" || ty === "double" || ty === "long long";
}

function cppDefault(p) {
	if (p.Default === undefined || p.Default === null) {
		return "";
	}
	const raw = String(p.Default);
	const ty = cppType(p.Type);
	if (raw.includes("__api_dump")) {
		return "";
	}
	if (raw === "nil" || raw === "null") {
		if (isPointerCppType(ty) || ty === "Instance" || /^[A-Z]/.test(ty)) {
			return " = null";
		}
		if (ty === "bool") {
			return " = false";
		}
		if (isNumericCppType(ty)) {
			return " = 0";
		}
		return "";
	}
	if (raw === "true" || raw === "false") {
		return " = " + raw;
	}
	if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(raw)) {
		return " = " + raw;
	}
	if (raw.startsWith("Enum.")) {
		const parts = raw.split(".");
		if (parts.length >= 3) {
			return ` = Enum::${ident(parts[1])}::${ident(parts[2])}`;
		}
	}
	if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
		return " = " + JSON.stringify(raw.slice(1, -1));
	}
	return "";
}

function emitParams(parameters) {
	const list = parameters || [];
	const defaults = list.map(cppDefault);
	const use = list.map(() => "");
	for (let i = list.length - 1; i >= 0; i--) {
		if (!defaults[i]) {
			break;
		}
		use[i] = defaults[i];
	}
	return list.map((p, i) => `${cppType(p.Type)} ${ident(p.Name)}${use[i]}`).join(", ");
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

function generate() {
	if (!fs.existsSync(DUMP)) {
		throw new Error("API dump not found at " + DUMP);
	}
	const dump = JSON.parse(fs.readFileSync(DUMP, "utf8"));
	const classes = dump.Classes;
	const enums = dump.Enums;
	const byName = new Map(classes.map((cls) => [cls.Name, cls]));

	const skipDatatypes = new Set(["Function", "Tuple", "Variant", "Array", "Dictionary", "Map", "User", "Instances", "ContentId"]);
	const datatypeNames = new Set(DATATYPE_SPEC.map((d) => d.name));
	function considerDatatype(t) {
		if (!t || t.Category !== "DataType" || !t.Name) {
			return;
		}
		const name = stripTypeName(t.Name);
		if (name && !skipDatatypes.has(name)) {
			datatypeNames.add(name);
		}
	}
	for (const cls of classes) {
		for (const member of cls.Members) {
			considerDatatype(member.ValueType);
			considerDatatype(member.ReturnType);
			for (const p of member.Parameters || []) {
				considerDatatype(p.Type);
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
	write(path.join(INCLUDE, "generated", "enums.clh"), enumsHpp);

	const specNames = new Set(DATATYPE_SPEC.map((d) => d.name));
	let dtHpp = `#pragma once
#include <clpp/generated/enums.clh>
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

using string = const char*;

// Variadic join. Cluaupp emits Luau a .. b .. c.
template <typename... Args>
string string_concat(Args... args);

struct Instance;
struct Player;

// Stand-in for values the C++ IntelliSense stubs cannot name precisely.
struct LuauValue {
	LuauValue();
	template <typename T>
	LuauValue(const T&);
	template <typename T>
	operator T() const;
};

template <typename T>
struct LuaArray {
	T* _begin;
	T* _end;
	T* begin() const { return _begin; }
	T* end() const { return _end; }
	int Size() const;
	T operator[](int index) const;
};
`;

	function emitDatatype(spec) {
		if (spec.custom && spec.name === "RBXScriptSignal") {
			return `
// Event. PlayerAdded.Connect(callback) — F matches any listener arity.
struct RBXScriptSignal {
	template <typename F>
	RBXScriptConnection Connect(F callback);
	template <typename F>
	RBXScriptConnection Once(F callback);
	template <typename F>
	RBXScriptConnection ConnectParallel(F callback);
	LuauValue Wait();
};
`;
		}
		let out = `\n// ${spec.summary || spec.name}\nstruct ${ident(spec.name)} {\n`;
		for (const field of spec.fields || []) {
			const parts = field.trim().split(/\s+/);
			const typeName = parts[0];
			const fieldName = parts[parts.length - 1];
			if (typeName === ident(spec.name) && !/[*&(]/.test(fieldName)) {
				out += `\t${ident(spec.name)} ${fieldName}() const;\n`;
				continue;
			}
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
		if (specNames.has(name) || skipDatatypes.has(name) || ident(name) === "Instance") {
			continue;
		}
		dtHpp += `\nstruct ${ident(name)} {};\n`;
	}
	write(path.join(INCLUDE, "datatypes.clh"), dtHpp);

	let instHpp = `#pragma once
#include <clpp/datatypes.clh>

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
		if (isCreatable(cls) || cls.Name === "Folder" || cls.Name === "Part") {
			instHpp += `\t${ident(cls.Name)}(Instance parent);\n`;
		}
		for (const member of cls.Members) {
			const name = memberIdent(cls.Name, member.Name);
			if (member.MemberType === "Property") {
				instHpp += `\t${cppType(member.ValueType)} ${name};\n`;
			} else if (member.MemberType === "Function") {
				instHpp += `\t${cppType(member.ReturnType, member.Name)} ${name}(${emitParams(member.Parameters)});\n`;
			} else if (member.MemberType === "Event") {
				instHpp += `\tRBXScriptSignal ${name};\n`;
			} else if (member.MemberType === "Callback") {
				instHpp += `\tvoid (*${name})();\n`;
			}
		}
		instHpp += `};\n\n`;
	}
	write(path.join(INCLUDE, "generated", "instances.clh"), instHpp);

	const umbrella = `#pragma once
// Cluaupp — Roblox API stubs for CL++ IntelliSense.
// Source: official client dump + datatypes from create.roblox.com
// clpp emits Luau (Vector3.new, Instance.new, :GetPlayers, ...).

#include <clpp/generated/enums.clh>
#include <clpp/datatypes.clh>
#include <clpp/generated/instances.clh>
#include <clpp/libs.clh>

template <typename T>
T GetService();

template <typename T>
T GetService(Instance game_);

extern DataModel game;
extern Workspace workspace;
extern LuaSourceContainer script;

void post(string message);
void warn(string message);
void report(string message);
string to_string(auto value);
double to_number(auto value);
bool to_bool(auto value);

double tick();
double time();
void wait(double seconds = 0);
void spawn(void (*callback)());
void delay(double seconds, void (*callback)());
`;
	write(path.join(INCLUDE, "roblox.clh"), umbrella);

	const gameInclude = path.join(ROOT, "..", "game", "include", "clpp");
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


generate();
