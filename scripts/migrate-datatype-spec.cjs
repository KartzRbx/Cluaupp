"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const src = execSync("git show HEAD:scripts/generate-api.js", {
	encoding: "utf8",
	maxBuffer: 20 * 1024 * 1024,
});
const start = src.indexOf("const DATATYPE_SPEC = ");
const end = src.indexOf("];", start) + 2;
const code = src.slice(start, end).replace("const DATATYPE_SPEC", "module.exports");
const file = path.join(__dirname, "_extract-datatype-spec.cjs");
fs.writeFileSync(file, code);
const SPEC = require(file);
const out = {
	_meta: {
		reason:
			"Migrated from scripts/generate-api.js DATATYPE_SPEC — Mini dump has no datatype definitions",
		source: "scripts/generate-api.js#DATATYPE_SPEC",
		introducedAt: "2026-09-22",
		reviewAfter: "2027-03-22",
	},
	datatypes: {},
};
for (const d of SPEC) {
	const entry = {};
	if (d.summary) entry.summary = d.summary;
	if (d.fields) entry.fields = d.fields;
	if (d.ctors) entry.ctors = d.ctors;
	if (d.statics) entry.statics = d.statics;
	if (d.staticMethods) entry.staticMethods = d.staticMethods;
	if (d.methods) entry.methods = d.methods;
	if (d.custom) entry.custom = true;
	out.datatypes[d.name] = entry;
}
const dest = path.join(__dirname, "..", "api", "overrides", "datatypes.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, "\t") + "\n");
fs.unlinkSync(file);
JSON.parse(fs.readFileSync(dest, "utf8"));
console.log("Wrote", Object.keys(out.datatypes).length, "datatypes to", dest);
