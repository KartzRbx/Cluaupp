"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLuauDefs = generateLuauDefs;
exports.tryLuauAnalyze = tryLuauAnalyze;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("../../package-info.js");
const resolver_js_1 = require("../resolver.js");
const identifier_js_1 = require("../identifier.js");
function atomicWrite(file, contents) {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    node_fs_1.default.writeFileSync(tmp, contents, "utf8");
    node_fs_1.default.renameSync(tmp, file);
}
function generateLuauDefs(profile, outDir = node_path_1.default.join(package_info_js_1.projectRoot, "api", "generated", "luau")) {
    const files = [];
    node_fs_1.default.mkdirSync(outDir, { recursive: true });
    let enums = `--!strict\n-- Generated Enums from RobloxTargetProfile\n`;
    for (const name of Object.keys(profile.enums).sort()) {
        const en = profile.enums[name];
        enums += `export type Enum${(0, identifier_js_1.escapeIdent)(en.name)} = {\n`;
        for (const item of en.items) {
            enums += `\t${(0, identifier_js_1.escapeIdent)(item.name)}: EnumItem,\n`;
        }
        enums += `}\n`;
    }
    const enumsPath = node_path_1.default.join(outDir, "enums.d.luau");
    atomicWrite(enumsPath, enums);
    files.push(enumsPath);
    let datatypes = `--!strict\n-- Generated Datatypes\n`;
    for (const name of Object.keys(profile.datatypes).sort()) {
        const dt = profile.datatypes[name];
        datatypes += `declare class ${(0, identifier_js_1.escapeIdent)(dt.name)}\n`;
        for (const field of dt.fields) {
            datatypes += `\t${(0, identifier_js_1.escapeIdent)(field.name)}: ${(0, resolver_js_1.typeToLuau)(field.type)}\n`;
        }
        for (const m of dt.instanceMethods) {
            const params = m.parameters.map((p) => `${(0, identifier_js_1.escapeIdent)(p.name)}: ${(0, resolver_js_1.typeToLuau)(p.type)}`).join(", ");
            const ret = (0, resolver_js_1.typeToLuau)(m.returnTypes[0] || { kind: "Any" });
            datatypes += `\tfunction ${(0, identifier_js_1.escapeIdent)(m.name)}(self${params ? `, ${params}` : ""}): ${ret}\n`;
        }
        datatypes += `end\n\n`;
    }
    const dtPath = node_path_1.default.join(outDir, "datatypes.d.luau");
    atomicWrite(dtPath, datatypes);
    files.push(dtPath);
    let classes = `--!strict\n-- Generated Classes (direct members only; see flatten view in CL++ headers)\n`;
    for (const name of Object.keys(profile.classes).sort()) {
        const cls = profile.classes[name];
        const extendsClause = cls.superclass ? ` extends ${(0, identifier_js_1.escapeIdent)(cls.superclass)}` : "";
        classes += `declare class ${(0, identifier_js_1.escapeIdent)(cls.name)}${extendsClause}\n`;
        for (const prop of cls.properties) {
            classes += `\t${(0, identifier_js_1.escapeIdent)(prop.name)}: ${(0, resolver_js_1.typeToLuau)(prop.valueType)}\n`;
        }
        for (const method of cls.methods) {
            const params = method.parameters.map((p) => `${(0, identifier_js_1.escapeIdent)(p.name)}: ${(0, resolver_js_1.typeToLuau)(p.type)}`).join(", ");
            const ret = (0, resolver_js_1.typeToLuau)(method.returnTypes[0] || { kind: "Any" });
            classes += `\tfunction ${(0, identifier_js_1.escapeIdent)(method.name)}(self${params ? `, ${params}` : ""}): ${ret}\n`;
        }
        for (const event of cls.events) {
            classes += `\t${(0, identifier_js_1.escapeIdent)(event.name)}: RBXScriptSignal\n`;
        }
        classes += `end\n\n`;
    }
    const classesPath = node_path_1.default.join(outDir, "classes.d.luau");
    atomicWrite(classesPath, classes);
    files.push(classesPath);
    let globals = `--!strict\n-- Generated Globals\n`;
    for (const name of Object.keys(profile.globals).sort()) {
        const g = profile.globals[name];
        globals += `declare ${(0, identifier_js_1.escapeIdent)(g.name)}: ${(0, resolver_js_1.typeToLuau)(g.type)}\n`;
    }
    const globalsPath = node_path_1.default.join(outDir, "globals.d.luau");
    atomicWrite(globalsPath, globals);
    files.push(globalsPath);
    return files;
}
function tryLuauAnalyze(filePath) {
    try {
        const { spawnSync } = require("node:child_process");
        const result = spawnSync("luau-analyze", [filePath], { encoding: "utf8" });
        if (result.error) {
            return { ok: true, output: "luau-analyze not available; skipped" };
        }
        return { ok: result.status === 0, output: (result.stdout || "") + (result.stderr || "") };
    }
    catch {
        return { ok: true, output: "luau-analyze not available; skipped" };
    }
}
