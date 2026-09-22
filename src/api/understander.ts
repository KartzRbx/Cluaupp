import type { ApiRegistry } from "./registry.js";
import { getApiRegistry } from "./ide.js";

/**
 * system-understander evolution: registry lookups + separate intent rules.
 * Do not mix "what the API is" with "what the author meant".
 */
export type IntentKind =
	| "create-instance"
	| "get-service"
	| "connect-event"
	| "require-module"
	| "unknown";

export interface IntentRule {
	id: string;
	kind: IntentKind;
	pattern: RegExp;
	description: string;
}

export const INTENT_RULES: IntentRule[] = [
	{
		id: "instance-new",
		kind: "create-instance",
		pattern: /\bInstance\s*\.\s*new\b|\bnew\s+[A-Z]\w+\s*\(/,
		description: "Construct a Roblox Instance",
	},
	{
		id: "get-service",
		kind: "get-service",
		pattern: /\bGetService\s*[<(]/,
		description: "Resolve a service via GetService",
	},
	{
		id: "connect-event",
		kind: "connect-event",
		pattern: /\.\s*Connect\s*\(/,
		description: "Connect to an RBXScriptSignal",
	},
	{
		id: "require",
		kind: "require-module",
		pattern: /\brequire\s*\(/,
		description: "Require a ModuleScript / library",
	},
];

export function matchIntents(source: string): IntentRule[] {
	return INTENT_RULES.filter((rule) => rule.pattern.test(source));
}

export function understandSymbol(symbol: string, registry?: ApiRegistry): {
	registryHit: boolean;
	kind?: string;
	intents: IntentKind[];
} {
	const reg = registry || getApiRegistry();
	if (reg.classes.has(symbol)) {
		return { registryHit: true, kind: "class", intents: [] };
	}
	if (reg.services.has(symbol)) {
		return { registryHit: true, kind: "service", intents: ["get-service"] };
	}
	if (reg.enums.has(symbol)) {
		return { registryHit: true, kind: "enum", intents: [] };
	}
	if (reg.datatypes.has(symbol)) {
		return { registryHit: true, kind: "datatype", intents: [] };
	}
	return { registryHit: false, intents: [] };
}
