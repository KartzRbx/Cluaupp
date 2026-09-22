"use strict";

// Runs after npm install / npm install -g. Copies schema IntelliSense into
// Cursor and VS Code (~/.cursor/extensions, ~/.vscode/extensions).

try {
	const { installEditorExtension } = require("../generated/intellisense.js");
	const installed = installEditorExtension();
	if (installed.length > 0) {
		console.log("cluaupp: installed schema IntelliSense (.flare .hive .mint .bloom .helm .shift .axiom)");
		for (const dest of installed) {
			console.log(" ", dest);
		}
	}
} catch (err) {
	console.warn("cluaupp: editor IntelliSense skip:", err instanceof Error ? err.message : err);
}
