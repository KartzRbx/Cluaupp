import fs from "node:fs";
import { hashBuffer } from "../resolver.js";
import type { LoadedSource } from "../loader.js";

/**
 * Parse LuauTypes.d.luau into a lightweight symbol index.
 * Full type AST is deferred; we extract declare/class/type names for cross-check.
 */
export function loadLuauTypes(filePath: string): LoadedSource<{ symbols: string[]; textHash: string }> {
	if (!fs.existsSync(filePath)) {
		throw new Error(`LuauTypes file not found: ${filePath}`);
	}
	const raw = fs.readFileSync(filePath);
	const text = raw.toString("utf8");
	const symbols = new Set<string>();
	const declareRe = /\b(?:declare|type|export type|class)\s+([A-Za-z_][\w.]*)/g;
	let match: RegExpExecArray | null;
	while ((match = declareRe.exec(text))) {
		symbols.add(match[1].split(".")[0]);
	}
	return {
		meta: {
			id: "luau-types",
			path: filePath,
			hash: hashBuffer(raw),
			loadedAt: new Date().toISOString(),
		},
		data: { symbols: [...symbols].sort(), textHash: hashBuffer(raw) },
	};
}
