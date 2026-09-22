"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClppTypeString = parseClppTypeString;
exports.mapNamedTypeLike = mapNamedTypeLike;
/** Parse simple CL++ type strings from override specs (e.g. "Vector3", "Enum::EasingStyle", "double?"). */
function parseClppTypeString(raw) {
    const text = String(raw || "").trim();
    if (!text) {
        return { kind: "Unknown" };
    }
    if (text.endsWith("?")) {
        return { kind: "Optional", inner: parseClppTypeString(text.slice(0, -1)) };
    }
    if (text.endsWith("*")) {
        return parseClppTypeString(text.slice(0, -1));
    }
    const arrayMatch = /^LuaArray<(.+)>$/.exec(text) || /^array<(.+)>$/i.exec(text);
    if (arrayMatch) {
        return { kind: "Array", element: parseClppTypeString(arrayMatch[1]) };
    }
    if (text.startsWith("Enum::")) {
        return { kind: "Enum", name: text.slice("Enum::".length) };
    }
    if (text === "bool" || text === "boolean") {
        return { kind: "Primitive", name: "boolean" };
    }
    if (text === "void") {
        return { kind: "Primitive", name: "void" };
    }
    if (text === "string" || text === "int" || text === "int64" || text === "float" || text === "double" || text === "long long") {
        if (text === "long long") {
            return { kind: "Primitive", name: "int64" };
        }
        return { kind: "Primitive", name: text };
    }
    if (text === "buffer") {
        return { kind: "Buffer" };
    }
    if (text === "auto" || text === "any") {
        return { kind: "Any" };
    }
    if (/^[A-Z]/.test(text)) {
        return { kind: "Datatype", name: text };
    }
    return { kind: "Primitive", name: text };
}
function mapNamedTypeLike(name) {
    return parseClppTypeString(name);
}
