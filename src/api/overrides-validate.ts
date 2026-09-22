import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import type { OverrideEntry } from "./model.js";

export interface OverrideValidationIssue {
	file: string;
	message: string;
}

/** Validate override JSON files carry audit metadata. */
export function validateOverrides(): OverrideValidationIssue[] {
	const dir = path.join(projectRoot, "api", "overrides");
	const issues: OverrideValidationIssue[] = [];
	if (!fs.existsSync(dir)) {
		return [{ file: "api/overrides", message: "overrides directory missing" }];
	}
	for (const name of fs.readdirSync(dir).sort()) {
		if (!name.endsWith(".json")) {
			continue;
		}
		const full = path.join(dir, name);
		const parsed = JSON.parse(fs.readFileSync(full, "utf8")) as { _meta?: OverrideEntry };
		if (!parsed._meta) {
			issues.push({ file: name, message: "missing _meta" });
			continue;
		}
		for (const key of ["reason", "source", "introducedAt"] as const) {
			if (!parsed._meta[key]) {
				issues.push({ file: name, message: `missing _meta.${key}` });
			}
		}
	}
	return issues;
}

export function diffOverrideFiles(beforeDir: string, afterDir: string): string[] {
	const before = new Set(fs.existsSync(beforeDir) ? fs.readdirSync(beforeDir).filter((f) => f.endsWith(".json")) : []);
	const after = new Set(fs.existsSync(afterDir) ? fs.readdirSync(afterDir).filter((f) => f.endsWith(".json")) : []);
	const changes: string[] = [];
	for (const f of after) {
		if (!before.has(f)) {
			changes.push(`ADDED ${f}`);
		} else {
			const a = fs.readFileSync(path.join(beforeDir, f), "utf8");
			const b = fs.readFileSync(path.join(afterDir, f), "utf8");
			if (a !== b) {
				changes.push(`CHANGED ${f}`);
			}
		}
	}
	for (const f of before) {
		if (!after.has(f)) {
			changes.push(`REMOVED ${f}`);
		}
	}
	return changes;
}
