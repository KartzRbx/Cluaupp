"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClppHeaders = generateClppHeaders;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../../package-info.js");
const identifier_js_1 = require("../identifier.js");
const registry_js_1 = require("../registry.js");
const resolver_js_1 = require("../resolver.js");
function mkdirp(dir) {
    node_fs_1.default.mkdirSync(dir, { recursive: true });
}
function atomicWrite(file, contents) {
    mkdirp(node_path_1.default.dirname(file));
    const tmp = `${file}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, contents, "utf8");
    node_fs_1.default.renameSync(tmp, file);
}
function headerType(type, memberName) {
    if (type.kind === "Unsupported") {
        return "auto";
    }
    if (type.kind === "Primitive") {
        if (type.name === "int64") {
            return "long long";
        }
        if (type.name === "boolean") {
            return "bool";
        }
        return type.name;
    }
    if (type.kind === "Datatype" && type.name === "Instances") {
        if (memberName === "GetPlayers" || memberName === "getPlayers" || memberName === "players") {
            return "LuaArray<Player>";
        }
        return "LuaArray<Instance>";
    }
    if (type.kind === "Datatype" && (type.name === "ContentId" || type.name === "BinaryString" || type.name === "ProtectedString" || type.name === "SharedString")) {
        return "string";
    }
    if (type.kind === "Class" || type.kind === "Datatype") {
        return (0, identifier_js_1.escapeIdent)(type.name);
    }
    const mapped = (0, resolver_js_1.typeToClpp)(type);
    if (mapped.includes("void*") || mapped === "auto") {
        return "auto";
    }
    return mapped;
}
function emitParams(parameters) {
    const defaults = parameters.map((p) => {
        if (!p.default || String(p.default).includes("__api_dump")) {
            return "";
        }
        const raw = String(p.default);
        if (raw === "nil" || raw === "null") {
            return " = null";
        }
        if (raw === "true" || raw === "false") {
            return ` = ${raw}`;
        }
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(raw)) {
            return ` = ${raw}`;
        }
        if (raw.startsWith("Enum.")) {
            const parts = raw.split(".");
            if (parts.length >= 3) {
                return ` = Enum::${(0, identifier_js_1.escapeIdent)(parts[1])}::${(0, identifier_js_1.escapeIdent)(parts[2])}`;
            }
        }
        return "";
    });
    const use = parameters.map(() => "");
    for (let i = parameters.length - 1; i >= 0; i--) {
        if (!defaults[i]) {
            break;
        }
        use[i] = defaults[i];
    }
    return parameters
        .map((p, i) => `${headerType(p.type)} ${(0, identifier_js_1.escapeIdent)(p.name)}${use[i]}`)
        .join(", ");
}
function generateEnums(enums) {
    let out = `#pragma once
// Generated from RobloxTargetProfile. Enum.Name.Item → Enum::Name::Item
namespace Enum {
`;
    for (const name of Object.keys(enums).sort()) {
        const en = enums[name];
        out += `\tenum class ${(0, identifier_js_1.escapeIdent)(en.name)} {\n`;
        for (const item of en.items) {
            out += `\t\t${(0, identifier_js_1.escapeIdent)(item.name)} = ${item.numericValue},\n`;
        }
        out += `\t};\n`;
    }
    out += `}\n`;
    return out;
}
function emitDatatype(dt) {
    if (dt.name === "RBXScriptSignal") {
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
    let out = `\n// ${dt.summary || dt.name}\nstruct ${(0, identifier_js_1.escapeIdent)(dt.name)} {\n`;
    for (const field of dt.fields) {
        const ty = headerType(field.type);
        if (ty === (0, identifier_js_1.escapeIdent)(dt.name)) {
            out += `\t${(0, identifier_js_1.escapeIdent)(dt.name)} ${(0, identifier_js_1.escapeIdent)(field.name)}() const;\n`;
        }
        else {
            out += `\t${ty} ${(0, identifier_js_1.escapeIdent)(field.name)};\n`;
        }
    }
    for (const ctor of dt.constructors) {
        out += `\t${(0, identifier_js_1.escapeIdent)(dt.name)}(${emitParams(ctor.parameters)});\n`;
    }
    for (const st of dt.staticProperties) {
        out += `\tstatic ${(0, identifier_js_1.escapeIdent)(dt.name)} ${(0, identifier_js_1.escapeIdent)(st)};\n`;
    }
    for (const m of dt.staticMethods) {
        out += `\tstatic ${headerType(m.returnTypes[0] || { kind: "Primitive", name: "void" })} ${(0, identifier_js_1.escapeIdent)(m.name)}(${emitParams(m.parameters)});\n`;
    }
    for (const m of dt.instanceMethods) {
        out += `\t${headerType(m.returnTypes[0] || { kind: "Primitive", name: "void" })} ${(0, identifier_js_1.escapeIdent)(m.name)}(${emitParams(m.parameters)});\n`;
    }
    out += `};\n`;
    return out;
}
function generateDatatypes(profile) {
    let out = `#pragma once
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
    const skip = new Set(["Function", "Tuple", "Variant", "Array", "Dictionary", "Map", "User", "Instances", "ContentId"]);
    for (const name of Object.keys(profile.datatypes).sort()) {
        out += emitDatatype(profile.datatypes[name]);
    }
    // Stub any datatype-like Class names referenced only as DataType elsewhere — kept empty for now.
    void skip;
    return out;
}
function isCreatableClass(cls) {
    return (cls.creatable ||
        cls.name === "Folder" ||
        cls.name === "Part" ||
        cls.name === "MeshPart" ||
        cls.name === "Model" ||
        cls.name === "WedgePart" ||
        cls.name === "CornerWedgePart" ||
        cls.name === "TrussPart");
}
function emitMethod(clsName, method) {
    const name = (0, identifier_js_1.escapeMember)(clsName, method.name);
    const ret = headerType(method.returnTypes[0] || { kind: "Primitive", name: "void" }, method.name);
    if (method.name === "WaitForChild" && method.parameters.length >= 1) {
        const first = `${headerType(method.parameters[0].type)} ${(0, identifier_js_1.escapeIdent)(method.parameters[0].name)}`;
        return `\t${ret} ${name}(${first});\n\t${ret} ${name}(${first}, double timeOut);\n`;
    }
    return `\t${ret} ${name}(${emitParams(method.parameters)});\n`;
}
function generateInstances(profile) {
    const registry = (0, registry_js_1.buildRegistry)(profile);
    let out = `#pragma once
#include <clpp/datatypes.clh>

// Flattened members: IntelliSense view from ClassGraph (does not mutate inheritance).
// Creatable classes get Class() and Class(Instance parent).

`;
    const classNames = Object.keys(profile.classes).sort();
    for (const name of classNames) {
        out += `struct ${(0, identifier_js_1.escapeIdent)(name)};\n`;
    }
    out += "\n";
    for (const name of classNames) {
        const cls = profile.classes[name];
        const superName = cls.superclass && profile.classes[cls.superclass] ? (0, identifier_js_1.escapeIdent)(cls.superclass) : "";
        const parent = superName ? ` : ${superName}` : "";
        out += `struct ${(0, identifier_js_1.escapeIdent)(cls.name)}${parent} {\n`;
        if (isCreatableClass(cls)) {
            out += `\t${(0, identifier_js_1.escapeIdent)(cls.name)}();\n`;
            out += `\t${(0, identifier_js_1.escapeIdent)(cls.name)}(Instance parent);\n`;
        }
        else if (!parent) {
            out += `\t${(0, identifier_js_1.escapeIdent)(cls.name)}() = default;\n`;
        }
        const flat = (0, registry_js_1.flattenMembers)(registry, cls.name);
        for (const prop of flat.properties) {
            out += `\t${headerType(prop.valueType)} ${(0, identifier_js_1.escapeMember)(cls.name, prop.name)};\n`;
        }
        for (const method of flat.methods) {
            out += emitMethod(cls.name, method);
        }
        for (const event of flat.events) {
            const params = event.parameters.map((p) => headerType(p.type)).join(", ");
            out += `\tRBXScriptSignal ${(0, identifier_js_1.escapeMember)(cls.name, event.name)};${params ? ` /* (${params}) */` : ""}\n`;
        }
        for (const cb of cls.callbacks) {
            out += `\tvoid (*${(0, identifier_js_1.escapeMember)(cls.name, cb.name)})();\n`;
        }
        out += `};\n\n`;
    }
    return out;
}
function generateApiJs(profile) {
    const instanceTypes = [];
    const services = [];
    const methods = new Set(["Connect", "Once", "Disconnect", "Wait", "GetService"]);
    for (const cls of Object.values(profile.classes)) {
        if (cls.service || cls.creation.service) {
            services.push(cls.name);
        }
        if (isCreatableClass(cls)) {
            instanceTypes.push(cls.name);
        }
        for (const m of cls.methods) {
            methods.add(m.name);
        }
    }
    for (const dt of Object.values(profile.datatypes)) {
        for (const m of dt.instanceMethods) {
            methods.add(m.name);
        }
    }
    const datatypes = Object.keys(profile.datatypes).sort();
    return `// Generated from RobloxTargetProfile schemaVersion ${profile.schemaVersion}
"use strict";
module.exports = {
	INSTANCE_TYPES: ${JSON.stringify(instanceTypes.sort(), null, "\t")},
	SERVICES: ${JSON.stringify(services.sort(), null, "\t")},
	METHODS: ${JSON.stringify([...methods].sort(), null, "\t")},
	DATATYPES: ${JSON.stringify(datatypes, null, "\t")},
};
`;
}
function generateUmbrella() {
    return `#pragma once
// Cluaupp — Roblox API stubs for CL++ IntelliSense (generated projection).
// Source of truth: RobloxTargetProfile registry — not this header.

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
double wait();
double wait(double seconds);
void delay(double seconds, func callback);

namespace task {
	double wait();
	double wait(double seconds);
	void delay(double seconds, func callback);
	void defer(func callback);
	void synchronize();
	void desynchronize();
	void spawn(func callback);
}
`;
}
function generateClppHeaders(profile, includeRoot = node_path_1.default.join(package_info_js_1.projectRoot, "include", "clpp")) {
    const files = [];
    const enumsPath = node_path_1.default.join(includeRoot, "generated", "enums.clh");
    const dtPath = node_path_1.default.join(includeRoot, "datatypes.clh");
    const instPath = node_path_1.default.join(includeRoot, "generated", "instances.clh");
    const umbrellaPath = node_path_1.default.join(includeRoot, "roblox.clh");
    const apiJs = node_path_1.default.join(package_info_js_1.projectRoot, "src", "api.generated.js");
    atomicWrite(enumsPath, generateEnums(profile.enums));
    files.push(enumsPath);
    atomicWrite(dtPath, generateDatatypes(profile));
    files.push(dtPath);
    atomicWrite(instPath, generateInstances(profile));
    files.push(instPath);
    atomicWrite(umbrellaPath, generateUmbrella());
    files.push(umbrellaPath);
    atomicWrite(apiJs, generateApiJs(profile));
    files.push(apiJs);
    return { files };
}
