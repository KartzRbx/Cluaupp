"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProfile = validateProfile;
exports.assertValid = assertValid;
function validateProfile(profile) {
    const issues = [];
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
    const seenEnums = new Set();
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
        const itemNames = new Set();
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
function detectCycle(cls, classes, issues) {
    const seen = new Set();
    let current = cls.name;
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
        const nextCls = classes[current];
        current = nextCls?.superclass || null;
    }
}
function checkTypeRefs(type, context, classes, enums, datatypes, issues) {
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
function assertValid(profile) {
    const errors = validateProfile(profile).filter((i) => i.severity === "error");
    if (errors.length) {
        throw new Error(`RobloxTargetProfile invalid:\n${errors.map((e) => `- ${e.code}: ${e.message}`).join("\n")}`);
    }
}
