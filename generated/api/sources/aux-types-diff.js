"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffAgainstAuxTypes = diffAgainstAuxTypes;
/**
 * Optional coverage cross-check against @rbxts/types or LuauTypes.
 * Never imported by the compile hot path.
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function collectDeclareClasses(text) {
    const names = new Set();
    const re = /\b(?:declare\s+class|export\s+type|interface|type)\s+([A-Za-z_][\w]*)/g;
    let match;
    while ((match = re.exec(text))) {
        names.add(match[1]);
    }
    return names;
}
/**
 * Diff registry class/datatype/enum names against a local types file or directory
 * (e.g. node_modules/@rbxts/types or Studio LuauTypes.d.luau).
 */
function diffAgainstAuxTypes(registryNames, auxPath) {
    if (!node_fs_1.default.existsSync(auxPath)) {
        throw new Error(`Aux types path not found: ${auxPath}`);
    }
    const stat = node_fs_1.default.statSync(auxPath);
    let auxSet;
    if (stat.isDirectory()) {
        auxSet = new Set();
        const stack = [auxPath];
        while (stack.length) {
            const dir = stack.pop();
            for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
                const full = node_path_1.default.join(dir, entry.name);
                if (entry.isDirectory()) {
                    stack.push(full);
                }
                else if (/\.(luau|ts|d\.ts)$/i.test(entry.name)) {
                    for (const name of collectDeclareClasses(node_fs_1.default.readFileSync(full, "utf8"))) {
                        auxSet.add(name);
                    }
                }
            }
        }
    }
    else {
        auxSet = collectDeclareClasses(node_fs_1.default.readFileSync(auxPath, "utf8"));
    }
    const regSet = new Set(registryNames);
    const onlyInAux = [];
    const onlyInRegistry = [];
    for (const name of auxSet) {
        if (!regSet.has(name)) {
            onlyInAux.push(name);
        }
    }
    for (const name of regSet) {
        if (!auxSet.has(name)) {
            onlyInRegistry.push(name);
        }
    }
    onlyInAux.sort();
    onlyInRegistry.sort();
    return {
        source: auxPath,
        auxSymbols: auxSet.size,
        registrySymbols: regSet.size,
        onlyInAux,
        onlyInRegistry,
    };
}
