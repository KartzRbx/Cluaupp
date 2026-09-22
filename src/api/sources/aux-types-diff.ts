/**
 * Optional coverage cross-check against @rbxts/types or LuauTypes.
 * Never imported by the compile hot path.
 */
import fs from "node:fs";
import path from "node:path";

export interface AuxTypesDiff {
	source: string;
	auxSymbols: number;
	registrySymbols: number;
	onlyInAux: string[];
	onlyInRegistry: string[];
}

function collectDeclareClasses(text: string): Set<string> {
	const names = new Set<string>();
	const re = /\b(?:declare\s+class|export\s+type|interface|type)\s+([A-Za-z_][\w]*)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text))) {
		names.add(match[1]);
	}
	return names;
}

/**
 * Diff registry class/datatype/enum names against a local types file or directory
 * (e.g. node_modules/@rbxts/types or Studio LuauTypes.d.luau).
 */
export function diffAgainstAuxTypes(
	registryNames: string[],
	auxPath: string,
): AuxTypesDiff {
	if (!fs.existsSync(auxPath)) {
		throw new Error(`Aux types path not found: ${auxPath}`);
	}
	const stat = fs.statSync(auxPath);
	let auxSet: Set<string>;
	if (stat.isDirectory()) {
		auxSet = new Set<string>();
		const stack = [auxPath];
		while (stack.length) {
			const dir = stack.pop()!;
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					stack.push(full);
				} else if (/\.(luau|ts|d\.ts)$/i.test(entry.name)) {
					for (const name of collectDeclareClasses(fs.readFileSync(full, "utf8"))) {
						auxSet.add(name);
					}
				}
			}
		}
	} else {
		auxSet = collectDeclareClasses(fs.readFileSync(auxPath, "utf8"));
	}

	const regSet = new Set(registryNames);
	const onlyInAux: string[] = [];
	const onlyInRegistry: string[] = [];
	for (const name of auxSet) {
		if (!regSet.has(name)) {
			onlyInAux.push(name);
		}
	}
	for (const name of regSet) {
		if (!auxSet.has(name)) {
			onlyInRegistry.push(name);
		}
	}
	onlyInAux.sort();
	onlyInRegistry.sort();
	return {
		source: auxPath,
		auxSymbols: auxSet.size,
		registrySymbols: regSet.size,
		onlyInAux,
		onlyInRegistry,
	};
}
