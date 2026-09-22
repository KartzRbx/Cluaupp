"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineColAt = lineColAt;
exports.stripCommentsKeepStrings = stripCommentsKeepStrings;
function lineColAt(source, index) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < index && i < source.length; i++) {
        if (source[i] === "\n") {
            line++;
            column = 1;
        }
        else {
            column++;
        }
    }
    return { line, column };
}
function stripCommentsKeepStrings(source) {
    let out = "";
    let i = 0;
    while (i < source.length) {
        const c = source[i];
        const next = source[i + 1];
        if (c === "/" && next === "/") {
            while (i < source.length && source[i] !== "\n")
                i++;
            continue;
        }
        if (c === "/" && next === "*") {
            i += 2;
            while (i < source.length - 1 && !(source[i] === "*" && source[i + 1] === "/")) {
                if (source[i] === "\n")
                    out += "\n";
                i++;
            }
            i += 2;
            continue;
        }
        if (c === '"' || c === "'" || c === "`") {
            const q = c;
            out += c;
            i++;
            while (i < source.length && source[i] !== q) {
                if (source[i] === "\\" && i + 1 < source.length) {
                    out += source[i] + source[i + 1];
                    i += 2;
                    continue;
                }
                out += source[i];
                i++;
            }
            if (i < source.length) {
                out += source[i];
                i++;
            }
            continue;
        }
        out += c;
        i++;
    }
    return out;
}
