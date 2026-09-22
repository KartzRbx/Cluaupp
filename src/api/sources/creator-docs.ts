import fs from "node:fs";
import path from "node:path";
import { hashBuffer } from "../resolver.js";
import type { LoadedSource } from "../loader.js";

/**
 * Creator Docs engine reference walker.
 * Expects a local clone of Roblox/creator-docs (or a fixture subtree).
 */
export function loadCreatorDocs(rootDir: string): LoadedSource<{ pages: string[] }> {
	if (!fs.existsSync(rootDir)) {
		throw new Error(`Creator Docs root not found: ${rootDir}`);
	}
	const pages: string[] = [];
	const stack = [rootDir];
	while (stack.length) {
		const dir = stack.pop()!;
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (/\.(md|mdx|yaml|yml)$/i.test(entry.name)) {
				pages.push(path.relative(rootDir, full).replace(/\\/g, "/"));
			}
		}
	}
	pages.sort();
	return {
		meta: {
			id: "creator-docs",
			path: rootDir,
			hash: hashBuffer(pages.join("\n")),
			loadedAt: new Date().toISOString(),
		},
		data: { pages },
	};
}
