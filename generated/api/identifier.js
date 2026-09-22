"use strict";
/** Deterministic identifier escaping for CL++ headers. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeIdent = escapeIdent;
exports.escapeMember = escapeMember;
exports.isReserved = isReserved;
const CLPP_RESERVED = new Set([
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
const MEMBER_COLLISIONS = {
    Instance: new Set(["class"]),
};
function escapeIdent(name) {
    let out = String(name || "");
    if (!out) {
        return "_";
    }
    if (/^\d/.test(out)) {
        out = `_${out}`;
    }
    out = out.replace(/[^A-Za-z0-9_]/g, "_");
    if (CLPP_RESERVED.has(out)) {
        out = `${out}_`;
    }
    return out;
}
function escapeMember(owner, name) {
    const escaped = escapeIdent(name);
    const collisions = MEMBER_COLLISIONS[owner];
    if (collisions?.has(name) || collisions?.has(escaped)) {
        return `${escaped}_`;
    }
    return escaped;
}
function isReserved(name) {
    return CLPP_RESERVED.has(name);
}
