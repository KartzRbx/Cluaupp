"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMiniDump = normalizeMiniDump;
const resolver_js_1 = require("./resolver.js");
function tagsOf(member) {
    return Array.isArray(member.Tags)
        ? member.Tags.map((t) => (typeof t === "string" ? t : String(t.PreferredDescriptorName || JSON.stringify(t))))
        : [];
}
function hasTag(tags, tag) {
    return tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}
function securityString(sec) {
    if (!sec) {
        return undefined;
    }
    if (typeof sec === "string") {
        return sec;
    }
    return sec.Read || sec.Write;
}
function mapThreadSafety(raw) {
    if (!raw) {
        return undefined;
    }
    switch (raw) {
        case "Unsafe":
        case "ReadSafe":
        case "LocalSafe":
        case "Safe":
            return raw;
        default:
            return "Unknown";
    }
}
function creationPolicy(tags) {
    const service = hasTag(tags, "Service");
    const notCreatable = hasTag(tags, "NotCreatable");
    const deprecated = hasTag(tags, "Deprecated");
    const pluginOnly = hasTag(tags, "PluginSecurity") || hasTag(tags, "NotBrowsable");
    return {
        kind: service ? "service" : notCreatable ? "abstract" : "creatable",
        creatable: !notCreatable && !service,
        service,
        abstract: notCreatable && !service,
        pluginOnly,
        notes: deprecated ? "deprecated" : undefined,
    };
}
function parseParams(member) {
    return (member.Parameters || []).map((p, i) => (0, resolver_js_1.mapParameter)(p, i));
}
function returnTypes(member) {
    if (member.ReturnType) {
        return [(0, resolver_js_1.mapRobloxType)(member.ReturnType)];
    }
    return [{ kind: "Primitive", name: "void" }];
}
function collectUnsupported(type, symbol, unsupported) {
    if (type.kind === "Unsupported") {
        unsupported.push({
            symbol,
            source: "mini-api-dump",
            reason: type.reason,
            fallback: "auto",
            severity: "warning",
        });
    }
    else if (type.kind === "Optional") {
        collectUnsupported(type.inner, symbol, unsupported);
    }
    else if (type.kind === "Array") {
        collectUnsupported(type.element, symbol, unsupported);
    }
    else if (type.kind === "Dictionary" || type.kind === "Map") {
        collectUnsupported(type.key, symbol, unsupported);
        collectUnsupported(type.value, symbol, unsupported);
    }
    else if (type.kind === "Union" || type.kind === "Intersection" || type.kind === "Tuple") {
        const members = type.kind === "Tuple" ? type.elements : type.members;
        for (const m of members) {
            collectUnsupported(m, symbol, unsupported);
        }
    }
}
function normalizeClass(raw, unsupported) {
    const tags = tagsOf(raw);
    const creation = creationPolicy(tags);
    const properties = [];
    const methods = [];
    const events = [];
    const callbacks = [];
    const methodOverloads = new Map();
    for (const member of raw.Members || []) {
        const mTags = tagsOf(member);
        const deprecated = hasTag(mTags, "Deprecated")
            ? { deprecated: true, message: "Deprecated in Roblox API dump" }
            : undefined;
        const symbol = `${raw.Name}.${member.Name}`;
        switch (member.MemberType) {
            case "Property": {
                const valueType = (0, resolver_js_1.mapRobloxType)(member.ValueType);
                collectUnsupported(valueType, symbol, unsupported);
                const sec = typeof member.Security === "object" ? member.Security : undefined;
                properties.push({
                    name: member.Name,
                    owner: raw.Name,
                    valueType,
                    readable: !hasTag(mTags, "WriteOnly"),
                    writable: !hasTag(mTags, "ReadOnly"),
                    readSecurity: sec?.Read || (typeof member.Security === "string" ? member.Security : undefined),
                    writeSecurity: sec?.Write,
                    threadSafety: mapThreadSafety(member.ThreadSafety),
                    tags: mTags,
                    defaultValue: member.Default,
                    deprecated,
                });
                break;
            }
            case "Function":
            case "Method": {
                const idx = methodOverloads.get(member.Name) || 0;
                methodOverloads.set(member.Name, idx + 1);
                const parameters = parseParams(member);
                const returns = returnTypes(member);
                for (const p of parameters) {
                    collectUnsupported(p.type, `${symbol}(${p.name})`, unsupported);
                }
                for (const r of returns) {
                    collectUnsupported(r, `${symbol}:return`, unsupported);
                }
                methods.push({
                    name: member.Name,
                    owner: raw.Name,
                    overloadIndex: idx,
                    parameters,
                    returnTypes: returns,
                    canYield: hasTag(mTags, "Yields") || hasTag(mTags, "CanYield"),
                    security: securityString(member.Security),
                    threadSafety: mapThreadSafety(member.ThreadSafety),
                    tags: mTags,
                    deprecated,
                });
                break;
            }
            case "Event": {
                const parameters = parseParams(member);
                for (const p of parameters) {
                    collectUnsupported(p.type, `${symbol}(${p.name})`, unsupported);
                }
                events.push({
                    name: member.Name,
                    owner: raw.Name,
                    parameters,
                    listenSecurity: securityString(member.Security),
                    threadSafety: mapThreadSafety(member.ThreadSafety),
                    tags: mTags,
                    deprecated,
                });
                break;
            }
            case "Callback": {
                const parameters = parseParams(member);
                const returns = returnTypes(member);
                callbacks.push({
                    name: member.Name,
                    owner: raw.Name,
                    parameters,
                    returnTypes: returns,
                    canYield: hasTag(mTags, "Yields"),
                    security: securityString(member.Security),
                    threadSafety: mapThreadSafety(member.ThreadSafety),
                    tags: mTags,
                    deprecated,
                });
                break;
            }
            default:
                unsupported.push({
                    symbol,
                    source: "mini-api-dump",
                    reason: `Unhandled MemberType ${member.MemberType}`,
                    fallback: "skip",
                    severity: "info",
                });
        }
    }
    return {
        name: raw.Name,
        superclass: raw.Superclass && raw.Superclass !== "<<<ROOT>>>" ? raw.Superclass : null,
        subclasses: [],
        tags,
        deprecated: hasTag(tags, "Deprecated") ? { deprecated: true } : undefined,
        creatable: creation.creatable,
        service: creation.service,
        creation,
        properties,
        methods,
        events,
        callbacks,
        constructors: [],
    };
}
function normalizeMiniDump(dump) {
    const unsupported = [];
    const classes = {};
    for (const raw of dump.Classes) {
        classes[raw.Name] = normalizeClass(raw, unsupported);
    }
    for (const cls of Object.values(classes)) {
        if (cls.superclass && classes[cls.superclass]) {
            classes[cls.superclass].subclasses.push(cls.name);
        }
    }
    for (const cls of Object.values(classes)) {
        cls.subclasses.sort();
    }
    const enums = {};
    for (const e of dump.Enums) {
        enums[e.Name] = {
            name: e.Name,
            items: (e.Items || []).map((item) => ({
                name: item.Name,
                numericValue: item.Value,
                tags: [],
            })),
            tags: [],
        };
    }
    return { classes, enums, unsupported };
}
