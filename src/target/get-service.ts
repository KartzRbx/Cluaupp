/**
 * GetService\<T\>() — Cluaupp host feature (Roblox Target), not a CL++ language primitive.
 *
 * CL++ parses `GetService<Players>()` as a normal generic call and may emit
 * `game:GetService("Players")`. Cluaupp owns:
 * - which names are services (Canonical Registry)
 * - IntelliSense stubs (`#include <clpp/roblox.clh>`)
 * - Context Safety / capability rules for services
 * - unknown-service diagnostics at build time
 */

import type { CompileDiagnostic } from "../clpp/contract.js";
import type { RobloxTargetProfile } from "../api/model.js";
import { buildRobloxTargetProfile } from "../api/build-profile.js";
import { lineColAt, stripCommentsKeepStrings } from "./diagnostics.js";
import { resolveGetServiceType } from "./roblox.js";

const GET_SERVICE_CALL =
	/\bGetService\s*(?:<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)|\(\s*["']([A-Za-z_]\w*)["']\s*\))/g;

export interface GetServiceUse {
	service: string;
	index: number;
	generic: boolean;
}

/** Extract GetService\<T\>() / GetService("T") uses from CL++ source. */
export function collectGetServiceUses(source: string): GetServiceUse[] {
	const clean = stripCommentsKeepStrings(source);
	const out: GetServiceUse[] = [];
	GET_SERVICE_CALL.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = GET_SERVICE_CALL.exec(clean))) {
		const service = m[1] || m[2];
		if (!service) continue;
		out.push({ service, index: m.index, generic: Boolean(m[1]) });
	}
	return out;
}

export function checkGetService(
	source: string,
	fileName: string,
	profile?: RobloxTargetProfile,
): CompileDiagnostic[] {
	const p = profile || buildRobloxTargetProfile({ skipValidate: true });
	const clean = stripCommentsKeepStrings(source);
	const out: CompileDiagnostic[] = [];
	for (const use of collectGetServiceUses(source)) {
		if (resolveGetServiceType(use.service, p)) {
			continue;
		}
		const { line, column } = lineColAt(clean, use.index);
		out.push({
			message: `CLUAU_SVC001: unknown service \`${use.service}\` for GetService (Cluaupp registry)`,
			line,
			column,
			severity: "error",
		});
	}
	return out;
}

export function assertGetServiceSafe(
	source: string,
	fileName: string,
	profile?: RobloxTargetProfile,
): void {
	const diags = checkGetService(source, fileName, profile);
	if (diags.length === 0) {
		return;
	}
	const body = diags.map((d) => `  ${fileName}:${d.line}:${d.column}: ${d.message}`).join("\n");
	throw new Error(`cluaupp: GetService check failed\n${body}`);
}

/**
 * Normalize free-standing GetService leftovers in Luau to game:GetService("Name").
 * Prefer CL++ emit; this is a host safety net for host-owned semantics.
 */
export function rewriteGetServiceLuau(luau: string): string {
	return String(luau)
		.replace(/\bGetService\s*<\s*([A-Za-z_]\w*)\s*>\s*\(\s*\)/g, 'game:GetService("$1")')
		.replace(/\bGetService\s*\(\s*["']([A-Za-z_]\w*)["']\s*\)/g, 'game:GetService("$1")');
}
