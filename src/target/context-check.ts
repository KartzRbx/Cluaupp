/**
 * Scan CL++ source for Context Safety violations (capability rules).
 * Heuristic line scan — not a full AST. Good enough for phase-1 platform rules.
 */

import type { CompileDiagnostic } from "../clpp/contract.js";
import { builtinCapabilityProfile, type CapabilityProfile, type CapabilityRule } from "./capabilities.js";
import { runContextFromFileName, type RunContext } from "./roblox.js";

export interface ContextViolation extends CompileDiagnostic {
	code: string;
	context: RunContext;
}

/** Strip line comments, block comments, and rough string/char literals for scanning. */
export function stripNoise(source: string): string {
	let out = "";
	let i = 0;
	while (i < source.length) {
		const c = source[i];
		const next = source[i + 1];
		if (c === "/" && next === "/") {
			while (i < source.length && source[i] !== "\n") {
				i++;
			}
			continue;
		}
		if (c === "/" && next === "*") {
			i += 2;
			while (i < source.length - 1 && !(source[i] === "*" && source[i + 1] === "/")) {
				if (source[i] === "\n") {
					out += "\n";
				}
				i++;
			}
			i += 2;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			const quote = c;
			out += " ";
			i++;
			while (i < source.length && source[i] !== quote) {
				if (source[i] === "\\" && i + 1 < source.length) {
					i += 2;
					continue;
				}
				if (source[i] === "\n") {
					out += "\n";
				}
				i++;
			}
			i++;
			continue;
		}
		out += c;
		i++;
	}
	return out;
}

function lineColumn(source: string, index: number): { line: number; column: number } {
	let line = 1;
	let column = 1;
	for (let i = 0; i < index && i < source.length; i++) {
		if (source[i] === "\n") {
			line++;
			column = 1;
		} else {
			column++;
		}
	}
	return { line, column };
}

function activeRegionContext(lineText: string, current: RunContext, fileContext: RunContext): RunContext {
	const trimmed = lineText.trim();
	if (/^\[\[\s*server\s*\]\]/i.test(trimmed)) {
		return "Server";
	}
	if (/^\[\[\s*client\s*\]\]/i.test(trimmed)) {
		return "Client";
	}
	if (/^\[\[\s*shared\s*\]\]/i.test(trimmed) || /^\[\[\s*plugin\s*\]\]/i.test(trimmed)) {
		if (/plugin/i.test(trimmed)) {
			return "Plugin";
		}
		return "Shared";
	}
	return current || fileContext;
}

export function checkContextSafety(
	source: string,
	fileName: string,
	profile: CapabilityProfile = builtinCapabilityProfile(),
): ContextViolation[] {
	const fileContext = runContextFromFileName(fileName);
	const cleaned = stripNoise(source);
	const violations: ContextViolation[] = [];
	const lines = cleaned.split(/\r?\n/);
	let region: RunContext = fileContext;

	const compiled = profile.rules.map((rule) => ({
		rule,
		re: new RegExp(rule.pattern, "g"),
	}));

	let offset = 0;
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const lineText = lines[lineIndex];
		region = activeRegionContext(lineText, region, fileContext);

		for (const { rule, re } of compiled) {
			if (!rule.forbiddenIn.includes(region)) {
				continue;
			}
			re.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = re.exec(lineText))) {
				const abs = offset + (match.index || 0);
				const pos = lineColumn(source, mapCleanIndexToSource(source, cleaned, abs));
				violations.push({
					code: rule.id,
					message: `${rule.id}: ${rule.message} (context=${region})`,
					line: pos.line,
					column: pos.column,
					severity: rule.severity,
					context: region,
				});
			}
		}
		offset += lineText.length + 1;
	}

	return violations;
}

/** Best-effort map from cleaned index back toward original (same newlines preserved). */
function mapCleanIndexToSource(original: string, cleaned: string, cleanIndex: number): number {
	if (cleaned.length === original.length) {
		return Math.min(cleanIndex, original.length);
	}
	// Newlines aligned — walk both counting newlines + approx columns
	let oi = 0;
	let ci = 0;
	while (ci < cleanIndex && oi < original.length && ci < cleaned.length) {
		if (original[oi] === cleaned[ci]) {
			oi++;
			ci++;
			continue;
		}
		// skip noise already stripped from cleaned
		oi++;
	}
	return oi;
}

export function formatContextViolations(fileName: string, violations: ContextViolation[]): string {
	return violations
		.map((v) => `${fileName}:${v.line}:${v.column}: ${v.severity}[${v.code}]: ${v.message}`)
		.join("\n");
}

export function assertContextSafe(source: string, fileName: string, profile?: CapabilityProfile): void {
	const all = checkContextSafety(source, fileName, profile);
	const errors = all.filter((v) => v.severity === "error");
	if (errors.length) {
		throw new Error(formatContextViolations(fileName, errors));
	}
}

export function listContextWarnings(source: string, fileName: string, profile?: CapabilityProfile): ContextViolation[] {
	return checkContextSafety(source, fileName, profile).filter((v) => v.severity === "warning");
}

export type { CapabilityRule };
