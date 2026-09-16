"use strict";

const { compileSource } = require("../src/compile");

const source = `void init() {
	string name = "Money";
	cout << "EnsureStat: " << name << " not found" << endl;
	cout::print << "EnsureStat: " << name << " not found" << endl;
	cerr << "bad";
	cout::print("ok");
	cout::warn("careful");
	cout::error("fail");
	cout::ping("here");
	cout::endl();
}
`;

const luau = compileSource(source, "cout.cpp", { strict: true });
const checks = [
	'print("EnsureStat: ", name, " not found")',
	'warn("bad")',
	'print("ok")',
	'warn("careful")',
	'error("fail")',
	'print("here")',
	"print()",
];

const missing = checks.filter((piece) => !luau.includes(piece));
if (missing.length > 0) {
	console.error("Cluaupp cout test failed. Missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\nOutput:\n" + luau);
	process.exit(1);
}

if (/\bendl\b/.test(luau) || luau.includes("cout.")) {
	console.error("cout/endl must not leak into Luau");
	console.error(luau);
	process.exit(1);
}

console.log("Cluaupp cout ok");
