"use strict";
/**
 * Scan CL++ for WaitForChild / FindFirstChild chains against the Typed DataModel graph.
 * Supports GetService roots and simple `auto x = …WaitForChild` variable binding.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripComments = stripComments;
exports.checkDatamodelPaths = checkDatamodelPaths;
exports.assertDatamodelSafe = assertDatamodelSafe;
exports.formatDatamodelViolations = formatDatamodelViolations;
const datamodel_js_1 = require("./datamodel.js");
function stripComments(source) {
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
            const quote = c;
            out += c;
            i++;
            while (i < source.length && source[i] !== quote) {
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
const CHAIN = /(?:GetService\s*<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)|GetService\s*\(\s*"([A-Za-z_]\w*)"\s*\)|(?:\bgame\s*\.\s*)?([A-Za-z_]\w*))((?:\s*\.\s*(?:WaitForChild|FindFirstChild|FindFirstChildOfClass|FindFirstChildWhichIsA)\s*\(\s*"[^"]+"\s*(?:,[^)]*)?\))+)/g;
const CHILD_NAME = /\.\s*(?:WaitForChild|FindFirstChild|FindFirstChildOfClass|FindFirstChildWhichIsA)\s*\(\s*"([^"]+)"/g;
const BIND = /(?:auto|Instance|[A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*=\s*(?:GetService\s*<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)|GetService\s*\(\s*"([A-Za-z_]\w*)"\s*\)|([A-Za-z_]\w*))((?:\s*\.\s*(?:WaitForChild|FindFirstChild|FindFirstChildOfClass|FindFirstChildWhichIsA)\s*\(\s*"[^"]+"\s*(?:,[^)]*)?\))*)/g;
function lineCol(source, index) {
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
function serviceRoot(profile, serviceName) {
    return (0, datamodel_js_1.lookupChild)(profile.root, serviceName) || null;
}
function extractChildNames(chainTail) {
    const names = [];
    CHILD_NAME.lastIndex = 0;
    let m;
    while ((m = CHILD_NAME.exec(chainTail))) {
        names.push(m[1]);
    }
    return names;
}
function walkFrom(profile, rootName, names) {
    let node = serviceRoot(profile, rootName) || profile.byPath[rootName] || null;
    if (!node)
        return null;
    let walked = rootName;
    for (const childName of names) {
        const child = (0, datamodel_js_1.lookupChild)(node, childName);
        if (!child) {
            return { node, walked, missing: childName };
        }
        node = child;
        walked = `${walked}.${childName}`;
    }
    return { node, walked };
}
function buildVarEnv(clean, profile) {
    const env = new Map();
    BIND.lastIndex = 0;
    let m;
    while ((m = BIND.exec(clean))) {
        const varName = m[1];
        const rootName = m[2] || m[3] || m[4];
        const chainTail = m[5] || "";
        if (!rootName)
            continue;
        const names = extractChildNames(chainTail);
        const walked = walkFrom(profile, rootName, names);
        if (walked && !walked.missing) {
            env.set(varName, walked.node);
        }
    }
    return env;
}
function validateChain(profile, rootName, names, source, index, fileHint, env) {
    const out = [];
    let node = serviceRoot(profile, rootName) || profile.byPath[rootName] || env?.get(rootName) || null;
    if (!node) {
        return out;
    }
    let walked = node.path;
    for (const childName of names) {
        const child = (0, datamodel_js_1.lookupChild)(node, childName);
        if (!child) {
            const { line, column } = lineCol(source, index);
            const known = Object.keys(node.children).slice(0, 12).join(", ") || "(none)";
            out.push({
                code: "CLUAU_DM_MISSING_CHILD",
                message: `Typed DataModel: "${childName}" is not a child of ${walked} (${node.className}). Known: ${known}`,
                line,
                column,
                severity: "error",
                pathHint: `${node.path}.${childName}`,
            });
            void fileHint;
            break;
        }
        node = child;
        walked = node.path;
    }
    return out;
}
function checkDatamodelPaths(source, profile) {
    const clean = stripComments(source);
    const env = buildVarEnv(clean, profile);
    const violations = [];
    CHAIN.lastIndex = 0;
    let m;
    while ((m = CHAIN.exec(clean))) {
        const rootName = m[1] || m[2] || m[3];
        const names = extractChildNames(m[4]);
        if (!rootName || !names.length)
            continue;
        violations.push(...validateChain(profile, rootName, names, source, m.index, undefined, env));
    }
    return violations;
}
function assertDatamodelSafe(source, profile) {
    const errors = checkDatamodelPaths(source, profile).filter((v) => v.severity === "error");
    if (!errors.length)
        return;
    throw new Error(`Typed DataModel:\n${errors.map((e) => `  ${e.line}:${e.column} ${e.code} ${e.message}`).join("\n")}`);
}
function formatDatamodelViolations(file, violations) {
    return violations.map((v) => `${file}:${v.line}:${v.column}: ${v.severity}: ${v.code} ${v.message}`).join("\n");
}
