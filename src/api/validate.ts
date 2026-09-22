import type { ClassDefinition, EnumDefinition, RobloxTargetProfile, UnsupportedRepresentation } from "./model.js";

export interface ValidationIssue {
	severity: "error" | "warning";
	code: string;
	message: string;
	symbol?: string;
}

export function validateProfile(profile: RobloxTargetProfile): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const classNames = new Set(Object.keys(profile.classes));
	const enumNames = new Set(Object.keys(profile.enums));
	const datatypeNames = new Set(Object.keys(profile.datatypes));

	for (const cls of Object.values(profile.classes)) {
		if (cls.superclass && !classNames.has(cls.superclass)) {
			issues.push({
				severity: "warning",
				code: "ORPHAN_SUPERCLASS",
				message: `Class ${cls.name} references missing superclass ${cls.superclass}`,
				symbol: cls.name,
			});
		}
		detectCycle(cls, profile.classes, issues);
		for (const prop of cls.properties) {
			checkTypeRefs(prop.valueType, `property ${cls.name}.${prop.name}`, classNames, enumNames, datatypeNames, issues);
		}
		for (const method of cls.methods) {
			for (const p of method.parameters) {
				checkTypeRefs(p.type, `method ${cls.name}.${method.name}`, classNames, enumNames, datatypeNames, issues);
			}
		}
	}

	const seenEnums = new Set<string>();
	for (const e of Object.values(profile.enums)) {
		if (seenEnums.has(e.name)) {
			issues.push({
				severity: "error",
				code: "DUPLICATE_ENUM",
				message: `Duplicate enum ${e.name}`,
				symbol: e.name,
			});
		}
		seenEnums.add(e.name);
		const itemNames = new Set<string>();
		for (const item of e.items) {
			if (itemNames.has(item.name)) {
				issues.push({
					severity: "warning",
					code: "DUPLICATE_ENUM_ITEM",
					message: `Duplicate enum item ${e.name}.${item.name}`,
					symbol: `${e.name}.${item.name}`,
				});
			}
			itemNames.add(item.name);
		}
	}

	for (const u of profile.unsupported) {
		if (u.severity === "error") {
			issues.push({
				severity: "error",
				code: "UNSUPPORTED",
				message: u.reason,
				symbol: u.symbol,
			});
		}
	}

	return issues;
}

function detectCycle(
	cls: ClassDefinition,
	classes: Record<string, ClassDefinition>,
	issues: ValidationIssue[],
): void {
	const seen = new Set<string>();
	let current: string | null = cls.name;
	while (current) {
		if (seen.has(current)) {
			issues.push({
				severity: "error",
				code: "INHERITANCE_CYCLE",
				message: `Inheritance cycle involving ${cls.name}`,
				symbol: cls.name,
			});
			return;
		}
		seen.add(current);
		const nextCls: ClassDefinition | undefined = classes[current];
		current = nextCls?.superclass || null;
	}
}

function checkTypeRefs(
	type: import("./model.js").CanonicalType,
	context: string,
	classes: Set<string>,
	enums: Set<string>,
	datatypes: Set<string>,
	issues: ValidationIssue[],
): void {
	switch (type.kind) {
		case "Class":
			if (!classes.has(type.name) && !datatypes.has(type.name)) {
				issues.push({
					severity: "warning",
					code: "UNRESOLVED_CLASS",
					message: `Unresolved class type ${type.name} in ${context}`,
					symbol: type.name,
				});
			}
			break;
		case "Enum":
			if (!enums.has(type.name)) {
				issues.push({
					severity: "warning",
					code: "UNRESOLVED_ENUM",
					message: `Unresolved enum ${type.name} in ${context}`,
					symbol: type.name,
				});
			}
			break;
		case "Datatype":
			if (!datatypes.has(type.name) && !classes.has(type.name)) {
				issues.push({
					severity: "warning",
					code: "UNRESOLVED_DATATYPE",
					message: `Unresolved datatype ${type.name} in ${context}`,
					symbol: type.name,
				});
			}
			break;
		case "Optional":
			checkTypeRefs(type.inner, context, classes, enums, datatypes, issues);
			break;
		case "Array":
			checkTypeRefs(type.element, context, classes, enums, datatypes, issues);
			break;
		case "Dictionary":
		case "Map":
			checkTypeRefs(type.key, context, classes, enums, datatypes, issues);
			checkTypeRefs(type.value, context, classes, enums, datatypes, issues);
			break;
		default:
			break;
	}
}

export function assertValid(profile: RobloxTargetProfile): void {
	const errors = validateProfile(profile).filter((i) => i.severity === "error");
	if (errors.length) {
		throw new Error(`RobloxTargetProfile invalid:\n${errors.map((e) => `- ${e.code}: ${e.message}`).join("\n")}`);
	}
}

export type { EnumDefinition, UnsupportedRepresentation };
