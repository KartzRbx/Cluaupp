/**
 * Registry query helpers for the CL++ Language Server / tooling contract.
 *
 * NOT a Cluaupp IntelliSense product. Autocomplete, hover UI, go-to-def, and LSP
 * protocol live in CLPP (`clpp` Language Server). Cluaupp only supplies data.
 */
import type { ApiRegistry } from "../api/registry.js";
import { buildRegistry, flattenMembers, searchRegistry } from "../api/registry.js";
import { buildRobloxTargetProfile } from "../api/build-profile.js";
import { typeToClpp } from "../api/resolver.js";

let cached: ApiRegistry | null = null;

export function getApiRegistry(force = false): ApiRegistry {
	if (!cached || force) {
		cached = buildRegistry(buildRobloxTargetProfile({ skipValidate: true }));
	}
	return cached;
}

/** Member listing for CLPP LSP / tests — not an IDE completion engine. */
export function listMembers(
	className: string,
	prefix = "",
): Array<{ label: string; kind: string; detail?: string }> {
	const registry = getApiRegistry();
	const flat = flattenMembers(registry, className);
	const p = prefix.toLowerCase();
	const out: Array<{ label: string; kind: string; detail?: string }> = [];
	for (const prop of flat.properties) {
		if (!p || prop.name.toLowerCase().startsWith(p)) {
			out.push({ label: prop.name, kind: "property", detail: typeToClpp(prop.valueType) });
		}
	}
	for (const method of flat.methods) {
		if (!p || method.name.toLowerCase().startsWith(p)) {
			out.push({
				label: method.name,
				kind: "method",
				detail: `(${method.parameters.map((x) => typeToClpp(x.type)).join(", ")})`,
			});
		}
	}
	for (const event of flat.events) {
		if (!p || event.name.toLowerCase().startsWith(p)) {
			out.push({
				label: event.name,
				kind: "event",
				detail: event.parameters.map((x) => typeToClpp(x.type)).join(", "),
			});
		}
	}
	return out;
}

/** @deprecated Use listMembers — name kept for callers during demotion. */
export const completeMember = listMembers;

export function describeSymbol(symbol: string): string | null {
	const registry = getApiRegistry();
	if (registry.classes.has(symbol)) {
		const cls = registry.classes.get(symbol)!;
		return `class ${cls.name}${cls.superclass ? ` : ${cls.superclass}` : ""}`;
	}
	if (registry.enums.has(symbol)) {
		return `enum ${symbol} (${registry.enums.get(symbol)!.items.length} items)`;
	}
	if (registry.datatypes.has(symbol)) {
		return `datatype ${symbol}`;
	}
	const member = registry.members.get(symbol);
	if (member) {
		return `${member.kind} ${symbol}`;
	}
	return null;
}

/** @deprecated Use describeSymbol. */
export const hoverSymbol = describeSymbol;

export function similarSymbols(symbol: string, limit = 5): string[] {
	const registry = getApiRegistry();
	return searchRegistry(registry, symbol.slice(0, Math.max(2, symbol.length - 1)), limit).map((h) => h.symbol);
}

/** @deprecated Use similarSymbols. */
export const suggestDidYouMean = similarSymbols;
