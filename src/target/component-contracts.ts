/**
 * DataModel component contracts — validate expected children/classNames on graph nodes.
 */

import type { DatamodelProfile } from "./datamodel.js";
import type { ComponentContract } from "./authority-check.js";
import type { PlatformDiagnostic } from "./diagnostics.js";

function isA(actual: string, expected: string): boolean {
	if (actual === expected) return true;
	// soft hierarchy aliases for v1
	const basePart = new Set(["Part", "MeshPart", "UnionOperation", "BasePart", "SpawnLocation", "WedgePart", "CornerWedgePart", "TrussPart"]);
	if (expected === "BasePart" && basePart.has(actual)) return true;
	if (expected === "Instance") return true;
	if (expected === "Folder" && (actual === "Folder" || actual === "Configuration")) return true;
	return false;
}

export function checkComponentContracts(
	profile: DatamodelProfile,
	contracts: ComponentContract[],
): PlatformDiagnostic[] {
	const out: PlatformDiagnostic[] = [];
	for (const contract of contracts) {
		const matches = Object.values(profile.byPath).filter(
			(n) => n.name === contract.path || n.path === contract.path || n.path.endsWith(`.${contract.path}`),
		);
		if (!matches.length) {
			out.push({
				code: "CLUAU_DM_CONTRACT_MISSING",
				message: `Component contract "${contract.path}" — no matching Instance in Rojo DataModel graph`,
				line: 1,
				column: 1,
				severity: "warning",
			});
			continue;
		}
		for (const node of matches) {
			for (const [childName, expectedClass] of Object.entries(contract.children)) {
				const child = node.children[childName];
				if (!child) {
					out.push({
						code: "CLUAU_DM_CONTRACT_CHILD",
						message: `Component ${node.path}: missing child "${childName}" (expected ${expectedClass})`,
						line: 1,
						column: 1,
						severity: "error",
					});
					continue;
				}
				if (!isA(child.className, expectedClass)) {
					out.push({
						code: "CLUAU_DM_CONTRACT_TYPE",
						message: `Component ${node.path}.${childName}: expected ${expectedClass}, got ${child.className}`,
						line: 1,
						column: 1,
						severity: "error",
					});
				}
			}
		}
	}
	return out;
}
