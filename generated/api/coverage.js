"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCoverage = computeCoverage;
function computeCoverage(registry) {
    let properties = 0;
    let methods = 0;
    let events = 0;
    let callbacks = 0;
    for (const cls of registry.classes.values()) {
        properties += cls.properties.length;
        methods += cls.methods.length;
        events += cls.events.length;
        callbacks += cls.callbacks.length;
    }
    const unsupported = registry.profile.unsupported;
    const totalMembers = properties + methods + events + callbacks;
    const gapCount = unsupported.filter((u) => u.severity !== "info").length;
    const coveragePercent = totalMembers === 0 ? 100 : Math.max(0, Math.round(((totalMembers - gapCount) / totalMembers) * 10000) / 100);
    return {
        classes: registry.classes.size,
        enums: registry.enums.size,
        datatypes: registry.datatypes.size,
        services: registry.services.size,
        properties,
        methods,
        events,
        callbacks,
        unsupported,
        coveragePercent,
        gaps: unsupported.map((u) => `${u.symbol}: ${u.reason}`),
    };
}
