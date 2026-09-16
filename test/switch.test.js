"use strict";

const { compileSource } = require("../src/compile");

const source = `void Handle(string action, int amount) {
	switch (action) {
	case "buy":
	case "purchase":
		print("bought");
		break;
	case "sell":
		if (amount <= 0) {
			break;
		}
		print("sold");
		break;
	default:
		print("unknown");
		break;
	}

	switch (amount + 1) {
	case 1:
		print("one");
		break;
	case 2:
		print("two");
		break;
	}
}
`;

const luau = compileSource(source, "switch.cpp", { strict: true });

const required = [
	'repeat',
	'until true',
	'action == "buy" or action == "purchase"',
	'elseif action == "sell" then',
	'else',
	'print("unknown")',
	'local __switch',
	'print("sold")',
	'break',
];

const missing = required.filter((piece) => !luau.includes(piece));
if (missing.length) {
	console.error("Cluaupp switch test failed:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error(luau);
	process.exit(1);
}

if (!luau.includes("if action == \"buy\"") && !luau.includes('if action == "buy" or')) {
	console.error("expected stacked buy/purchase case");
	console.error(luau);
	process.exit(1);
}

console.log("Cluaupp switch ok");
