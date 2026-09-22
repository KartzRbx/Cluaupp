/**
 * Opt-in SoA / dense storage codegen.
 * Triggered by `#pragma layout soa StructName` (or optimize --apply --layout).
 * Emits a Luau ModuleScript companion — does not silently rewrite gameplay structs.
 */

import fs from "node:fs";
import path from "node:path";
import { adviseOptimizer } from "./optimizer-advise.js";
import type { CluauppProfile } from "./pgo.js";
import { rankAdvice } from "./pgo.js";

export type SoaScalar = "f32" | "i32" | "bool" | "Vector3";

export interface SoaField {
	name: string;
	kind: SoaScalar;
}

export interface SoaPlan {
	structName: string;
	fields: SoaField[];
}

const FIELD_RE =
	/^(?:float|f32|double|f64)\s+([A-Za-z_]\w*)|^(?:int|i32)\s+([A-Za-z_]\w*)|^bool\s+([A-Za-z_]\w*)|^Vector3\s+([A-Za-z_]\w*)/;

export function parseSoaFields(structBody: string): SoaField[] {
	const fields: SoaField[] = [];
	for (const piece of structBody.split(";")) {
		const line = piece.trim().replace(/=.*/, "").trim();
		if (!line) continue;
		const m = line.match(FIELD_RE);
		if (!m) continue;
		if (m[1]) fields.push({ name: m[1], kind: "f32" });
		else if (m[2]) fields.push({ name: m[2], kind: "i32" });
		else if (m[3]) fields.push({ name: m[3], kind: "bool" });
		else if (m[4]) fields.push({ name: m[4], kind: "Vector3" });
	}
	return fields;
}

export function findStructBody(source: string, structName: string): string | null {
	const re = new RegExp(`struct\\s+${structName}\\s*\\{([^}]*)\\}`);
	const m = source.match(re);
	return m ? m[1] : null;
}

export function listLayoutTargets(source: string): string[] {
	const names = new Set<string>();
	const re = /#pragma\s+layout\s+soa\s+([A-Za-z_]\w*)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(source))) {
		names.add(m[1]);
	}
	return [...names];
}

export function planSoa(source: string, structName: string): SoaPlan | null {
	const body = findStructBody(source, structName);
	if (!body) return null;
	const fields = parseSoaFields(body);
	if (fields.length < 2) return null;
	return { structName, fields };
}

function defaultFor(kind: SoaScalar): string {
	if (kind === "f32") return "0";
	if (kind === "i32") return "0";
	if (kind === "bool") return "false";
	return "Vector3.zero";
}

/** Generate a standalone Luau SoA module (table-columns; buffer pack optional for floats). */
export function generateSoaLuau(plan: SoaPlan, useBuffer = false): string {
	const { structName, fields } = plan;
	const cols = fields
		.map((f) => {
			if (useBuffer && (f.kind === "f32" || f.kind === "i32")) {
				return `\t\t${f.name} = buffer.create(0), -- grown on ensure`;
			}
			return `\t\t${f.name} = table.create(capacity),`;
		})
		.join("\n");

	const pushLines = fields
		.map((f) => {
			if (useBuffer && f.kind === "f32") {
				return `\tbuffer.writef32(store.${f.name}, (i - 1) * 4, row.${f.name} or 0)`;
			}
			if (useBuffer && f.kind === "i32") {
				return `\tbuffer.writei32(store.${f.name}, (i - 1) * 4, row.${f.name} or 0)`;
			}
			return `\tstore.${f.name}[i] = row.${f.name}`;
		})
		.join("\n");

	const getLines = fields
		.map((f) => {
			if (useBuffer && f.kind === "f32") {
				return `\t\t${f.name} = buffer.readf32(store.${f.name}, (i - 1) * 4),`;
			}
			if (useBuffer && f.kind === "i32") {
				return `\t\t${f.name} = buffer.readi32(store.${f.name}, (i - 1) * 4),`;
			}
			return `\t\t${f.name} = store.${f.name}[i],`;
		})
		.join("\n");

	const ensureBuf = useBuffer
		? fields
				.filter((f) => f.kind === "f32" || f.kind === "i32")
				.map(
					(f) => `
	local need = capacity * 4
	if buffer.len(store.${f.name}) < need then
		local nb = buffer.create(need)
		buffer.copy(nb, 0, store.${f.name})
		store.${f.name} = nb
	end`,
				)
				.join("\n")
		: "";

	return `--!native
--!optimize 2
--!strict
-- cluaupp generated SoA for ${structName} — do not edit by hand.
-- Use via: local ${structName}Soa = require(...${structName}Soa)

export type ${structName}Row = {
${fields.map((f) => `\t${f.name}: ${f.kind === "f32" ? "number" : f.kind === "i32" ? "number" : f.kind === "bool" ? "boolean" : "Vector3"},`).join("\n")}
}

export type ${structName}Store = {
	len: number,
	capacity: number,
${fields.map((f) => `\t${f.name}: ${useBuffer && (f.kind === "f32" || f.kind === "i32") ? "buffer" : "{}"},`).join("\n")}
}

local ${structName}Soa = {}

function ${structName}Soa.new(capacity: number): ${structName}Store
	capacity = math.max(1, capacity or 64)
	local store = {
		len = 0,
		capacity = capacity,
${cols}
	}
	return store
end

function ${structName}Soa.ensure(store: ${structName}Store, capacity: number)
	if capacity <= store.capacity then
		return
	end
	store.capacity = capacity
${ensureBuf}
${useBuffer ? "" : fields.map((f) => `\t-- table.create columns grow on index assign`).join("\n")}
end

function ${structName}Soa.push(store: ${structName}Store, row: ${structName}Row): number
	local i = store.len + 1
	${structName}Soa.ensure(store, i)
	store.len = i
${pushLines}
	return i
end

function ${structName}Soa.get(store: ${structName}Store, i: number): ${structName}Row
	return {
${getLines}
	}
end

function ${structName}Soa.set(store: ${structName}Store, i: number, row: ${structName}Row)
${pushLines}
end

return ${structName}Soa
`;
}

export interface LayoutApplyResult {
	source: string;
	changed: boolean;
	applied: string[];
	plans: SoaPlan[];
}

/** Insert `#pragma layout soa Name` before advised storage structs. */
export function applyLayoutPragmas(
	source: string,
	fileName: string,
	profile: CluauppProfile | null = null,
): LayoutApplyResult {
	const advice = rankAdvice(adviseOptimizer(source, fileName), profile);
	const targets = new Set(advice.filter((a) => a.kind === "storage").map((a) => a.target));
	const applied: string[] = [];
	const plans: SoaPlan[] = [];
	let out = source;

	for (const name of targets) {
		if (new RegExp(`#pragma\\s+layout\\s+soa\\s+${name}\\b`).test(out)) {
			const plan = planSoa(out, name);
			if (plan) plans.push(plan);
			continue;
		}
		const re = new RegExp(`((?:^|\\n)(?:\\s*))(struct\\s+${name}\\s*\\{)`, "m");
		if (!re.test(out)) continue;
		out = out.replace(re, `$1#pragma layout soa ${name}\n$1$2`);
		applied.push(`#pragma layout soa → ${name}`);
		const plan = planSoa(out, name);
		if (plan) plans.push(plan);
	}

	for (const name of listLayoutTargets(out)) {
		if (plans.some((p) => p.structName === name)) continue;
		const plan = planSoa(out, name);
		if (plan) plans.push(plan);
	}

	return { source: out, changed: applied.length > 0, applied, plans };
}

export function writeSoaArtifacts(
	projectRoot: string,
	plans: SoaPlan[],
	opts: { useBuffer?: boolean } = {},
): string[] {
	if (!plans.length) return [];
	const outDir = path.join(projectRoot, ".cluaupp", "generated", "soa");
	fs.mkdirSync(outDir, { recursive: true });
	const written: string[] = [];
	for (const plan of plans) {
		const file = path.join(outDir, `${plan.structName}Soa.luau`);
		fs.writeFileSync(file, generateSoaLuau(plan, opts.useBuffer === true), "utf8");
		written.push(file);
	}
	return written;
}

/** Collect SoA plans from all sources that already have layout pragmas. */
export function collectSoaPlansFromProject(projectRoot: string, rootDir = "src"): SoaPlan[] {
	const srcDir = path.join(projectRoot, rootDir);
	if (!fs.existsSync(srcDir)) return [];
	const plans: SoaPlan[] = [];
	const seen = new Set<string>();
	const walk = (dir: string) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
				continue;
			}
			if (!/\.(clpp|clp|clh)$/i.test(entry.name)) continue;
			const source = fs.readFileSync(full, "utf8");
			for (const name of listLayoutTargets(source)) {
				if (seen.has(name)) continue;
				const plan = planSoa(source, name);
				if (plan) {
					seen.add(name);
					plans.push(plan);
				}
			}
		}
	};
	walk(srcDir);
	return plans;
}
