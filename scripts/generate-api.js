"use strict";

const fs = require("fs");
const path = require("path");
const { localLayout, homeBody, introBody, movedBody, learnBody, preCode, oopGuide, examplesGuide, librariesGuide, printCoutGuide } = require("./site-html");

const ROOT = path.join(__dirname, "..");
const DUMP = path.join(ROOT, "data", "Mini-API-Dump.json");
const INCLUDE = path.join(ROOT, "include", "cluaupp");
const SITE = path.join(ROOT, "site");

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
		return "::" + ident(name) + "*";
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
				return "LuaArray<::Player*>";
			}
			return "LuaArray<::Instance*>";
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
		if (isPointerCppType(ty)) {
			return " = nullptr";
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

using string = const char*;

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
		if (isCreatable(cls) || cls.Name === "Folder" || cls.Name === "Part") {
			instHpp += `\t${ident(cls.Name)}(::Instance* parent);\n`;
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
	write(path.join(INCLUDE, "generated", "instances.hpp"), instHpp);

	const umbrella = `#pragma once
// Cluaupp — full Roblox API for IntelliSense.
// Source: official client dump + datatypes from create.roblox.com
// The compiler ignores #include and emits real Luau (Vector3.new, Instance.new, :GetPlayers, ...).

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

struct cout {
	static void print(string message);
	static void warn(string message);
	static void error(string message);
	static void ping(string message);
	static void endl();
	cout& operator<<(string value);
	cout& operator<<(int value);
	cout& operator<<(double value);
	cout& operator<<(bool value);
} cout;

struct cerr {
	cerr& operator<<(string value);
	cerr& operator<<(int value);
} cerr;

const int endl = 0;
double tick();
double time();
void wait(double seconds = 0);
void spawn(void (*callback)());
void delay(double seconds, void (*callback)());
`;
	write(path.join(INCLUDE, "roblox.hpp"), umbrella);

	const gameInclude = path.join(ROOT, "..", "game", "include", "cluaupp");
	if (fs.existsSync(path.join(ROOT, "..", "game"))) {
		fs.cpSync(INCLUDE, gameInclude, { recursive: true });
	}

	try {
		buildSite({ classes, enums, byName, dump, instanceTypes, services });
	} catch (err) {
		console.warn("Site generate skipped:", err.message);
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

function sidebarFor(kind, items, prefix) {
	const listId = kind + "-list";
	let html = `<input type="search" data-filter-input="${listId}" placeholder="Filter ${kind}...">`;
	html += `<ul class="list" id="${listId}">`;
	for (const name of items) {
		html += `<li><a href="${prefix}${name}.html">${escapeHtml(name)}</a></li>`;
	}
	html += `</ul>`;
	return html;
}

function article(html) {
	return `<article class="docs-article">${html}</article>`;
}

function buildSite({ classes, enums, byName, dump, instanceTypes, services }) {
	mkdirp(path.join(SITE, "assets"));
	mkdirp(path.join(SITE, "api", "classes"));
	mkdirp(path.join(SITE, "api", "datatypes"));
	mkdirp(path.join(SITE, "api", "enums"));
	mkdirp(path.join(SITE, "guide"));
	mkdirp(path.join(SITE, "learn"));
	write(path.join(SITE, ".nojekyll"), "");

	write(
		path.join(SITE, "index.html"),
		localLayout("Docs", homeBody({ dump, classCount: classes.length, enumCount: enums.length }), "", 0, "home"),
	);
	write(path.join(SITE, "learn", "index.html"), localLayout("Learn", learnBody(), "", 1, "learn"));
	write(path.join(SITE, "intro.html"), localLayout("Intro", introBody("./"), "", 0, "home"));
	mkdirp(path.join(SITE, "intro"));
	write(path.join(SITE, "intro", "index.html"), localLayout("Intro", introBody("../"), "", 1, "home"));
	write(
		path.join(SITE, "getting-started.html"),
		localLayout("Get started", movedBody("./", "guide/getting-started.html", "Getting started"), "", 0, "start"),
	);
	write(
		path.join(SITE, "404.html"),
		localLayout(
			"Not found",
			`<article class="docs-article"><h1>Not found</h1><p class="muted">That Moonwave path is gone. Try the home page, Learn, or Getting started.</p><p><a class="btn btn-primary" href="./index.html">Home</a> <a class="btn btn-ghost" href="./intro.html">Intro</a> <a class="btn btn-ghost" href="./learn/index.html">Learn</a></p></article>`,
			"",
			0,
			"home",
		),
	);
	mkdirp(path.join(SITE, "docs"));
	write(path.join(SITE, "docs", "intro.html"), localLayout("Intro", introBody("../"), "", 1, "home"));

	const getting = `
<div class="crumb"><a href="../index.html">Cluaupp</a> / Get started</div>
<h1>Getting started</h1>
<p class="muted">Cluaupp is the definitive merge of C++ and modern Luau (<code>local</code>, <code>const</code>, optional <code>--!strict</code>) with first-class Roblox APIs.</p>
<h2>Install</h2>
${preCode(`npm install -g cluaupp
cluaupp init my-game
cd my-game
cluaupp build
rojo serve`, "plain")}
<p>Connect the Rojo plugin in Roblox Studio. Then open <a href="../learn/index.html">Learn</a> for the language, <a href="oop.html">OOP</a> for typed services, or <a href="examples.html">Examples</a> for copy-paste systems.</p>
<h2>Datatypes in C++</h2>
${preCode(`#include <cluaupp/roblox.hpp>

void init() {
  auto* part = new Part(workspace);
  part->Name = "Platform";
  part->Size = Vector3(8, 1, 8);
  part->Position = Vector3(0, 10, 0);
  part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
  part->Anchored = true;
  part->BrickColor = BrickColor("Bright red");
  part->Color = Color3::fromRGB(255, 0, 0);

  auto* gui = new ScreenGui(GetService<Players>()->LocalPlayer->FindFirstChild("PlayerGui"));
  auto* frame = new Frame(gui);
  frame->Size = UDim2::fromScale(1, 1);
  frame->Position = UDim2(0, 0, 0, 0);
}`, "cpp")}
<p>This becomes <code>Vector3.new</code>, <code>CFrame.lookAt</code>, <code>UDim2.fromScale</code>, <code>Color3.fromRGB</code>, and <code>Instance.new("Part")</code>.</p>
<p>Official reference: <a href="https://create.roblox.com/docs/reference/engine/datatypes">datatypes</a> and <a href="https://create.roblox.com/docs/reference/engine/classes">classes</a>.</p>
`;
	write(path.join(SITE, "guide", "getting-started.html"), localLayout("Get started", article(getting), "", 1, "start"));
	write(path.join(SITE, "guide", "oop.html"), localLayout("OOP structure", oopGuide(), "", 1, "learn"));
	write(path.join(SITE, "guide", "examples.html"), localLayout("Examples", examplesGuide(), "", 1, "examples"));
	write(path.join(SITE, "guide", "libraries.html"), localLayout("Libraries", librariesGuide(), "", 1, "learn"));
	write(path.join(SITE, "guide", "print-cout.html"), localLayout("print and cout", printCoutGuide(), "", 1, "learn"));

	const dtIndex = DATATYPE_SPEC.map(
		(d) => `<a class="card" href="${d.name}.html"><strong>${d.name}</strong><br><span class="muted">${escapeHtml(d.summary || "datatype")}</span></a>`,
	).join("\n");
	write(
		path.join(SITE, "api", "datatypes", "index.html"),
		localLayout(
			"Datatypes",
			article(
				`<h1>Datatypes</h1><p class="muted">Engine value types. In C++ you construct with <code>Vector3(x,y,z)</code>; Cluaupp emits <code>Vector3.new</code>.</p><input type="search" data-filter-input="dt-grid" placeholder="Filter datatypes..."><div class="grid" id="dt-grid">${dtIndex}</div>`,
			),
			"",
			2,
			"datatypes",
		),
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
			localLayout(spec.name, body, sidebarFor("datatypes", dtNames, ""), 2, "datatypes"),
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
			article(
				`<h1>Classes</h1><p class="muted">${classes.length} classes from the official dump. Each page lists properties, methods, and events, with the C++ / Luau mapping and a Creator Hub link.</p><p>${services.length} services · ${instanceTypes.length} creatable with <code>new Class(parent)</code>.</p><input type="search" data-filter-input="class-grid" placeholder="Filter classes..."><div class="grid" id="class-grid">${classCards}</div>`,
			),
			"",
			2,
			"classes",
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
			body += `<h2>Construct</h2>${preCode(`auto* obj = new ${cls.Name}(parent);
// Instance.new("${cls.Name}")
// obj.Parent = parent`, "cpp")}`;
		}
		if (isService(cls)) {
			body += `<h2>Service</h2>${preCode(`auto* svc = GetService<${cls.Name}>();
// game:GetService("${cls.Name}")`, "cpp")}`;
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
			localLayout(cls.Name, body, sidebarFor("classes", classNames, ""), 2, "classes"),
		);
	}

	const enumNames = enums.map((e) => e.Name);
	const enumCards = enums
		.map((e) => `<a class="card" href="${e.Name}.html"><strong>${escapeHtml(e.Name)}</strong><br><span class="muted">${e.Items.length} items</span></a>`)
		.join("\n");
	write(
		path.join(SITE, "api", "enums", "index.html"),
		localLayout(
			"Enums",
			article(
				`<h1>Enums</h1><p class="muted">C++: <code>Enum::Material::Plastic</code>. Luau: <code>Enum.Material.Plastic</code>.</p><input type="search" data-filter-input="enum-grid" placeholder="Filter enums..."><div class="grid" id="enum-grid">${enumCards}</div>`,
			),
			"",
			2,
			"enums",
		),
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
			localLayout(en.Name, body, sidebarFor("enums", enumNames, ""), 2, "enums"),
		);
	}
}

generate();
require("./check-highlight");
