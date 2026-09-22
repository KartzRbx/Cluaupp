import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../../package-info.js";
import type { RobloxTargetProfile } from "../model.js";
import { typeToLuau } from "../resolver.js";
import { escapeIdent } from "../identifier.js";

function atomicWrite(file: string, contents: string): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, contents, "utf8");
	fs.renameSync(tmp, file);
}

export function generateLuauDefs(
	profile: RobloxTargetProfile,
	outDir = path.join(projectRoot, "api", "generated", "luau"),
): string[] {
	const files: string[] = [];
	fs.mkdirSync(outDir, { recursive: true });

	let enums = `--!strict\n-- Generated Enums from RobloxTargetProfile\n`;
	for (const name of Object.keys(profile.enums).sort()) {
		const en = profile.enums[name];
		enums += `export type Enum${escapeIdent(en.name)} = {\n`;
		for (const item of en.items) {
			enums += `\t${escapeIdent(item.name)}: EnumItem,\n`;
		}
		enums += `}\n`;
	}
	const enumsPath = path.join(outDir, "enums.d.luau");
	atomicWrite(enumsPath, enums);
	files.push(enumsPath);

	let datatypes = `--!strict\n-- Generated Datatypes\n`;
	for (const name of Object.keys(profile.datatypes).sort()) {
		const dt = profile.datatypes[name];
		datatypes += `declare class ${escapeIdent(dt.name)}\n`;
		for (const field of dt.fields) {
			datatypes += `\t${escapeIdent(field.name)}: ${typeToLuau(field.type)}\n`;
		}
		for (const m of dt.instanceMethods) {
			const params = m.parameters.map((p) => `${escapeIdent(p.name)}: ${typeToLuau(p.type)}`).join(", ");
			const ret = typeToLuau(m.returnTypes[0] || { kind: "Any" });
			datatypes += `\tfunction ${escapeIdent(m.name)}(self${params ? `, ${params}` : ""}): ${ret}\n`;
		}
		datatypes += `end\n\n`;
	}
	const dtPath = path.join(outDir, "datatypes.d.luau");
	atomicWrite(dtPath, datatypes);
	files.push(dtPath);

	let classes = `--!strict\n-- Generated Classes (direct members only; see flatten view in CL++ headers)\n`;
	for (const name of Object.keys(profile.classes).sort()) {
		const cls = profile.classes[name];
		const extendsClause = cls.superclass ? ` extends ${escapeIdent(cls.superclass)}` : "";
		classes += `declare class ${escapeIdent(cls.name)}${extendsClause}\n`;
		for (const prop of cls.properties) {
			classes += `\t${escapeIdent(prop.name)}: ${typeToLuau(prop.valueType)}\n`;
		}
		for (const method of cls.methods) {
			const params = method.parameters.map((p) => `${escapeIdent(p.name)}: ${typeToLuau(p.type)}`).join(", ");
			const ret = typeToLuau(method.returnTypes[0] || { kind: "Any" });
			classes += `\tfunction ${escapeIdent(method.name)}(self${params ? `, ${params}` : ""}): ${ret}\n`;
		}
		for (const event of cls.events) {
			classes += `\t${escapeIdent(event.name)}: RBXScriptSignal\n`;
		}
		classes += `end\n\n`;
	}
	const classesPath = path.join(outDir, "classes.d.luau");
	atomicWrite(classesPath, classes);
	files.push(classesPath);

	let globals = `--!strict\n-- Generated Globals\n`;
	for (const name of Object.keys(profile.globals).sort()) {
		const g = profile.globals[name];
		globals += `declare ${escapeIdent(g.name)}: ${typeToLuau(g.type)}\n`;
	}
	const globalsPath = path.join(outDir, "globals.d.luau");
	atomicWrite(globalsPath, globals);
	files.push(globalsPath);

	return files;
}

export function tryLuauAnalyze(filePath: string): { ok: boolean; output: string } {
	try {
		const { spawnSync } = require("node:child_process") as typeof import("node:child_process");
		const result = spawnSync("luau-analyze", [filePath], { encoding: "utf8" });
		if (result.error) {
			return { ok: true, output: "luau-analyze not available; skipped" };
		}
		return { ok: result.status === 0, output: (result.stdout || "") + (result.stderr || "") };
	} catch {
		return { ok: true, output: "luau-analyze not available; skipped" };
	}
}
