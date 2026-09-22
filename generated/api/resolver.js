"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashBuffer = hashBuffer;
exports.mapRobloxType = mapRobloxType;
exports.mapParameter = mapParameter;
exports.typeToClpp = typeToClpp;
exports.typeToLuau = typeToLuau;
exports.eventSignalType = eventSignalType;
const node_crypto_1 = require("node:crypto");
const PRIMITIVE_MAP = {
    bool: "boolean",
    boolean: "boolean",
    int: "int",
    int64: "int64",
    float: "float",
    double: "double",
    number: "double",
    string: "string",
    null: "void",
    void: "void",
    nil: "void",
};
function hashBuffer(data) {
    return (0, node_crypto_1.createHash)("sha256").update(data).digest("hex");
}
function mapRobloxType(ref) {
    if (!ref) {
        return { kind: "Unknown" };
    }
    if (typeof ref === "string") {
        return mapNamedType(ref);
    }
    const category = String(ref.Category || "");
    const name = String(ref.Name || "");
    let mapped;
    switch (category) {
        case "Primitive":
            mapped = mapNamedType(name);
            break;
        case "Class":
            mapped = { kind: "Class", name };
            break;
        case "Enum":
            mapped = { kind: "Enum", name };
            break;
        case "DataType":
            if (name === "Function") {
                mapped = {
                    kind: "Function",
                    parameters: [{ kind: "Any" }],
                    returns: [{ kind: "Any" }],
                    variadic: true,
                };
            }
            else if (name === "buffer" || name === "Buffer") {
                mapped = { kind: "Buffer" };
            }
            else {
                mapped = { kind: "Datatype", name };
            }
            break;
        case "Group":
            if (name === "Array") {
                mapped = { kind: "Array", element: { kind: "Any" } };
            }
            else if (name === "Dictionary" || name === "Map") {
                mapped = {
                    kind: "Dictionary",
                    key: { kind: "Any" },
                    value: { kind: "Any" },
                };
            }
            else if (name === "Tuple") {
                mapped = { kind: "Tuple", elements: [{ kind: "Any" }] };
            }
            else if (name === "Variant") {
                mapped = { kind: "Any" };
            }
            else {
                mapped = {
                    kind: "Unsupported",
                    raw: `${category}:${name}`,
                    reason: `Group type ${name} has no direct CL++ mapping yet`,
                };
            }
            break;
        default:
            if (!name) {
                mapped = { kind: "Unknown" };
            }
            else {
                mapped = mapNamedType(name);
            }
    }
    if (ref.Optional || /\?$/.test(name)) {
        return { kind: "Optional", inner: stripOptionalMarker(mapped) };
    }
    return mapped;
}
function stripOptionalMarker(type) {
    if (type.kind === "Class" || type.kind === "Enum" || type.kind === "Datatype" || type.kind === "Primitive") {
        return { ...type, name: type.name.replace(/\?$/, "") };
    }
    return type;
}
function mapNamedType(rawName) {
    const name = rawName.replace(/\?$/, "");
    if (!name) {
        return { kind: "Unknown" };
    }
    if (name === "any") {
        return { kind: "Any" };
    }
    if (name === "unknown") {
        return { kind: "Unknown" };
    }
    if (name === "never") {
        return { kind: "Never" };
    }
    if (name === "buffer" || name === "Buffer") {
        return { kind: "Buffer" };
    }
    if (PRIMITIVE_MAP[name]) {
        return { kind: "Primitive", name: PRIMITIVE_MAP[name] };
    }
    if (/^[A-Z]/.test(name)) {
        return { kind: "Class", name };
    }
    return { kind: "Primitive", name };
}
function mapParameter(param, index) {
    const name = param.Name || `arg${index}`;
    const type = mapRobloxType(param.Type);
    const optional = type.kind === "Optional" || param.Default !== undefined;
    const def = classifyDefault(param.Default);
    return {
        name,
        type: optional && type.kind !== "Optional" ? { kind: "Optional", inner: type } : type,
        optional,
        default: param.Default,
        defaultKind: def,
    };
}
function classifyDefault(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === "null" || value === "nil") {
        return "Null";
    }
    if (value === "true" || value === "false") {
        return "Boolean";
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return "Number";
    }
    if (/^Enum\./.test(value)) {
        return "EnumItem";
    }
    if (/^['"`]/.test(value)) {
        return "String";
    }
    return "Unknown";
}
function typeToClpp(type) {
    switch (type.kind) {
        case "Primitive":
            if (type.name === "boolean") {
                return "bool";
            }
            if (type.name === "void") {
                return "void";
            }
            return type.name;
        case "Class":
        case "Datatype":
            return type.name;
        case "Enum":
            return `Enum::${type.name}`;
        case "Optional":
            return `${typeToClpp(type.inner)}?`;
        case "Array":
            return `array<${typeToClpp(type.element)}>`;
        case "Dictionary":
        case "Map":
            return `dictionary<${typeToClpp(type.key)}, ${typeToClpp(type.value)}>`;
        case "Tuple":
            return `tuple<${type.elements.map(typeToClpp).join(", ")}>`;
        case "Function":
            return "func";
        case "Union":
            return type.members.map(typeToClpp).join(" | ");
        case "Buffer":
            return "buffer";
        case "Any":
            return "auto";
        case "Unknown":
            return "auto";
        case "Never":
            return "void";
        case "Unsupported":
            return "auto";
        default:
            return "auto";
    }
}
function typeToLuau(type) {
    switch (type.kind) {
        case "Primitive":
            if (type.name === "int" || type.name === "int64" || type.name === "float" || type.name === "double") {
                return "number";
            }
            if (type.name === "void") {
                return "()";
            }
            return type.name;
        case "Class":
        case "Datatype":
            return type.name;
        case "Enum":
            return `Enum.${type.name}`;
        case "Optional":
            return `${typeToLuau(type.inner)}?`;
        case "Array":
            return `{ ${typeToLuau(type.element)} }`;
        case "Dictionary":
        case "Map":
            return `{ [${typeToLuau(type.key)}]: ${typeToLuau(type.value)} }`;
        case "Buffer":
            return "buffer";
        case "Any":
            return "any";
        case "Unknown":
            return "unknown";
        case "Function":
            return "(...any) -> ...any";
        case "Unsupported":
            return "any";
        default:
            return "any";
    }
}
function eventSignalType(parameters) {
    return {
        kind: "Datatype",
        name: parameters.length
            ? `RBXScriptSignal/*(${parameters.map((p) => typeToClpp(p.type)).join(", ")})*/`
            : "RBXScriptSignal",
    };
}
