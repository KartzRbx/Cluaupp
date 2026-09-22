/**
 * Non-product: does not mirror Creator Docs.
 * Official docs stay at https://create.roblox.com/docs
 * Prefer `cluaupp api search|inspect` and the LSP index for tooling.
 */
import type { RobloxTargetProfile } from "../model.js";

export function generateReferenceDocs(_profile: RobloxTargetProfile, _outDir?: string): string[] {
	// Intentionally a no-op — reuse-first: do not generate class/enum markdown mirrors.
	return [];
}
