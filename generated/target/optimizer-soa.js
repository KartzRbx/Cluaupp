"use strict";
/**
 * Opt-in SoA / dense storage codegen.
 * Triggered by `#pragma layout soa StructName` (or optimize --apply --layout).
 * Emits a Luau ModuleScript companion — does not silently rewrite gameplay structs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSoaFields = parseSoaFields;
exports.findStructBody = findStructBody;
exports.listLayoutTargets = listLayoutTargets;
exports.planSoa = planSoa;
exports.generateSoaLuau = generateSoaLuau;
exports.applyLayoutPragmas = applyLayoutPragmas;
exports.writeSoaArtifacts = writeSoaArtifacts;
exports.collectSoaPlansFromProject = collectSoaPlansFromProject;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const optimizer_advise_js_1 = require("./optimizer-advise.js");
const pgo_js_1 = require("./pgo.js");
const FIELD_RE = /^(?:float|f32|double|f64)\s+([A-Za-z_]\w*)|^(?:int|i32)\s+([A-Za-z_]\w*)|^bool\s+([A-Za-z_]\w*)|^Vector3\s+([A-Za-z_]\w*)/;
function parseSoaFields(structBody) {
    const fields = [];
    for (const piece of structBody.split(";")) {
        const line = piece.trim().replace(/=.*/, "").trim();
        if (!line)
            continue;
        const m = line.match(FIELD_RE);
        if (!m)
            continue;
        if (m[1])
            fields.push({ name: m[1], kind: "f32" });
        else if (m[2])
            fields.push({ name: m[2], kind: "i32" });
        else if (m[3])
            fields.push({ name: m[3], kind: "bool" });
        else if (m[4])
            fields.push({ name: m[4], kind: "Vector3" });
    }
    return fields;
}
function findStructBody(source, structName) {
    const re = new RegExp(`struct\\s+${structName}\\s*\\{([^}]*)\\}`);
    const m = source.match(re);
    return m ? m[1] : null;
}
function listLayoutTargets(source) {
    const names = new Set();
    const re = /#pragma\s+layout\s+soa\s+([A-Za-z_]\w*)/g;
    let m;
    while ((m = re.exec(source))) {
        names.add(m[1]);
    }
    return [...names];
}
function planSoa(source, structName) {
    const body = findStructBody(source, structName);
    if (!body)
        return null;
    const fields = parseSoaFields(body);
    if (fields.length < 2)
        return null;
    return { structName, fields };
}
function defaultFor(kind) {
    if (kind === "f32")
        return "0";
    if (kind === "i32")
        return "0";
    if (kind === "bool")
        return "false";
    return "Vector3.zero";
}
/** Generate a standalone Luau SoA module (table-columns; buffer pack optional for floats). */
function generateSoaLuau(plan, useBuffer = false) {
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
            .map((f) => `
	local need = capacity * 4
	if buffer.len(store.${f.name}) < need then
		local nb = buffer.create(need)
		buffer.copy(nb, 0, store.${f.name})
		store.${f.name} = nb
	end`)
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
/** Insert `#pragma layout soa Name` before advised storage structs. */
function applyLayoutPragmas(source, fileName, profile = null) {
    const advice = (0, pgo_js_1.rankAdvice)((0, optimizer_advise_js_1.adviseOptimizer)(source, fileName), profile);
    const targets = new Set(advice.filter((a) => a.kind === "storage").map((a) => a.target));
    const applied = [];
    const plans = [];
    let out = source;
    for (const name of targets) {
        if (new RegExp(`#pragma\\s+layout\\s+soa\\s+${name}\\b`).test(out)) {
            const plan = planSoa(out, name);
            if (plan)
                plans.push(plan);
            continue;
        }
        const re = new RegExp(`((?:^|\\n)(?:\\s*))(struct\\s+${name}\\s*\\{)`, "m");
        if (!re.test(out))
            continue;
        out = out.replace(re, `$1#pragma layout soa ${name}\n$1$2`);
        applied.push(`#pragma layout soa → ${name}`);
        const plan = planSoa(out, name);
        if (plan)
            plans.push(plan);
    }
    for (const name of listLayoutTargets(out)) {
        if (plans.some((p) => p.structName === name))
            continue;
        const plan = planSoa(out, name);
        if (plan)
            plans.push(plan);
    }
    return { source: out, changed: applied.length > 0, applied, plans };
}
function writeSoaArtifacts(projectRoot, plans, opts = {}) {
    if (!plans.length)
        return [];
    const outDir = node_path_1.default.join(projectRoot, ".cluaupp", "generated", "soa");
    node_fs_1.default.mkdirSync(outDir, { recursive: true });
    const written = [];
    for (const plan of plans) {
        const file = node_path_1.default.join(outDir, `${plan.structName}Soa.luau`);
        node_fs_1.default.writeFileSync(file, generateSoaLuau(plan, opts.useBuffer === true), "utf8");
        written.push(file);
    }
    return written;
}
/** Collect SoA plans from all sources that already have layout pragmas. */
function collectSoaPlansFromProject(projectRoot, rootDir = "src") {
    const srcDir = node_path_1.default.join(projectRoot, rootDir);
    if (!node_fs_1.default.existsSync(srcDir))
        return [];
    const plans = [];
    const seen = new Set();
    const walk = (dir) => {
        for (const entry of node_fs_1.default.readdirSync(dir, { withFileTypes: true })) {
            const full = node_path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            if (!/\.(clpp|clp|clh)$/i.test(entry.name))
                continue;
            const source = node_fs_1.default.readFileSync(full, "utf8");
            for (const name of listLayoutTargets(source)) {
                if (seen.has(name))
                    continue;
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
