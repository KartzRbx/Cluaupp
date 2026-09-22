import type { ApiDiffEntry, RobloxTargetProfile } from "./model.js";
import { typeToClpp } from "./resolver.js";

export function diffProfiles(before: RobloxTargetProfile, after: RobloxTargetProfile): ApiDiffEntry[] {
	const out: ApiDiffEntry[] = [];
	const beforeClasses = new Set(Object.keys(before.classes));
	const afterClasses = new Set(Object.keys(after.classes));

	for (const name of afterClasses) {
		if (!beforeClasses.has(name)) {
			out.push({ kind: "ADDED_CLASS", symbol: name });
		}
	}
	for (const name of beforeClasses) {
		if (!afterClasses.has(name)) {
			out.push({ kind: "REMOVED_CLASS", symbol: name });
		}
	}

	for (const name of afterClasses) {
		if (!beforeClasses.has(name)) {
			continue;
		}
		const a = before.classes[name];
		const b = after.classes[name];
		if ((a.superclass || null) !== (b.superclass || null)) {
			out.push({
				kind: "CHANGED_SUPERCLASS",
				symbol: name,
				oldValue: a.superclass || undefined,
				newValue: b.superclass || undefined,
			});
		}
		diffProps(a.name, a.properties, b.properties, out);
		diffMethods(a.name, a.methods, b.methods, out);
		diffEvents(a.name, a.events, b.events, out);
	}

	const beforeEnums = new Set(Object.keys(before.enums));
	const afterEnums = new Set(Object.keys(after.enums));
	for (const name of afterEnums) {
		if (!beforeEnums.has(name)) {
			out.push({ kind: "ADDED_ENUM", symbol: name });
		}
	}
	for (const name of beforeEnums) {
		if (!afterEnums.has(name)) {
			out.push({ kind: "REMOVED_ENUM", symbol: name });
		} else {
			const aItems = new Set(before.enums[name].items.map((i) => i.name));
			const bItems = new Set(after.enums[name].items.map((i) => i.name));
			for (const item of bItems) {
				if (!aItems.has(item)) {
					out.push({ kind: "ADDED_ENUM_ITEM", symbol: `${name}.${item}` });
				}
			}
			for (const item of aItems) {
				if (!bItems.has(item)) {
					out.push({ kind: "REMOVED_ENUM_ITEM", symbol: `${name}.${item}` });
				}
			}
		}
	}

	return out;
}

function diffProps(
	owner: string,
	before: RobloxTargetProfile["classes"][string]["properties"],
	after: RobloxTargetProfile["classes"][string]["properties"],
	out: ApiDiffEntry[],
): void {
	const bMap = new Map(before.map((p) => [p.name, p]));
	const aMap = new Map(after.map((p) => [p.name, p]));
	for (const [name, prop] of aMap) {
		if (!bMap.has(name)) {
			out.push({ kind: "ADDED_PROPERTY", symbol: `${owner}.${name}` });
		} else {
			const old = bMap.get(name)!;
			if (typeToClpp(old.valueType) !== typeToClpp(prop.valueType)) {
				out.push({
					kind: "CHANGED_PROPERTY_TYPE",
					symbol: `${owner}.${name}`,
					oldValue: typeToClpp(old.valueType),
					newValue: typeToClpp(prop.valueType),
				});
			}
		}
	}
	for (const name of bMap.keys()) {
		if (!aMap.has(name)) {
			out.push({ kind: "REMOVED_PROPERTY", symbol: `${owner}.${name}` });
		}
	}
}

function diffMethods(
	owner: string,
	before: RobloxTargetProfile["classes"][string]["methods"],
	after: RobloxTargetProfile["classes"][string]["methods"],
	out: ApiDiffEntry[],
): void {
	const key = (m: { name: string; overloadIndex: number }) => `${m.name}#${m.overloadIndex}`;
	const bSet = new Set(before.map(key));
	const aSet = new Set(after.map(key));
	for (const k of aSet) {
		if (!bSet.has(k)) {
			out.push({ kind: "ADDED_METHOD_OVERLOAD", symbol: `${owner}.${k}` });
		}
	}
	for (const k of bSet) {
		if (!aSet.has(k)) {
			out.push({ kind: "REMOVED_METHOD_OVERLOAD", symbol: `${owner}.${k}` });
		}
	}
}

function diffEvents(
	owner: string,
	before: RobloxTargetProfile["classes"][string]["events"],
	after: RobloxTargetProfile["classes"][string]["events"],
	out: ApiDiffEntry[],
): void {
	const bMap = new Map(before.map((e) => [e.name, e]));
	const aMap = new Map(after.map((e) => [e.name, e]));
	for (const [name, ev] of aMap) {
		if (!bMap.has(name)) {
			out.push({ kind: "ADDED_EVENT", symbol: `${owner}.${name}` });
		} else {
			const oldSig = bMap.get(name)!.parameters.map((p) => typeToClpp(p.type)).join(",");
			const newSig = ev.parameters.map((p) => typeToClpp(p.type)).join(",");
			if (oldSig !== newSig) {
				out.push({
					kind: "CHANGED_EVENT_SIGNATURE",
					symbol: `${owner}.${name}`,
					oldValue: oldSig,
					newValue: newSig,
				});
			}
		}
	}
}
