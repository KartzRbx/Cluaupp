import type {
	ClassDefinition,
	EventDefinition,
	MethodDefinition,
	PropertyDefinition,
	RobloxTargetProfile,
	ServiceDefinition,
} from "./model.js";

export interface ApiRegistry {
	profile: RobloxTargetProfile;
	classes: Map<string, ClassDefinition>;
	services: Map<string, ServiceDefinition>;
	enums: Map<string, RobloxTargetProfile["enums"][string]>;
	datatypes: Map<string, RobloxTargetProfile["datatypes"][string]>;
	members: Map<string, { owner: string; kind: string; name: string }>;
	methods: Map<string, MethodDefinition[]>;
	properties: Map<string, PropertyDefinition>;
	events: Map<string, EventDefinition>;
	ancestors: Map<string, string[]>;
}

export function buildRegistry(profile: RobloxTargetProfile): ApiRegistry {
	const classes = new Map(Object.entries(profile.classes));
	const services = new Map(Object.entries(profile.services));
	const enums = new Map(Object.entries(profile.enums));
	const datatypes = new Map(Object.entries(profile.datatypes));
	const members = new Map<string, { owner: string; kind: string; name: string }>();
	const methods = new Map<string, MethodDefinition[]>();
	const properties = new Map<string, PropertyDefinition>();
	const events = new Map<string, EventDefinition>();
	const ancestors = new Map<string, string[]>();

	for (const cls of classes.values()) {
		ancestors.set(cls.name, collectAncestors(cls.name, profile.classes));
		for (const prop of cls.properties) {
			const key = `${cls.name}.${prop.name}`;
			properties.set(key, prop);
			members.set(key, { owner: cls.name, kind: "property", name: prop.name });
		}
		for (const method of cls.methods) {
			const key = `${cls.name}.${method.name}`;
			const list = methods.get(key) || [];
			list.push(method);
			methods.set(key, list);
			members.set(key, { owner: cls.name, kind: "method", name: method.name });
		}
		for (const event of cls.events) {
			const key = `${cls.name}.${event.name}`;
			events.set(key, event);
			members.set(key, { owner: cls.name, kind: "event", name: event.name });
		}
		for (const cb of cls.callbacks) {
			members.set(`${cls.name}.${cb.name}`, { owner: cls.name, kind: "callback", name: cb.name });
		}
	}

	return {
		profile,
		classes,
		services,
		enums,
		datatypes,
		members,
		methods,
		properties,
		events,
		ancestors,
	};
}

function collectAncestors(name: string, classes: Record<string, ClassDefinition>): string[] {
	const chain: string[] = [];
	let current = classes[name]?.superclass || null;
	const seen = new Set<string>();
	while (current && !seen.has(current)) {
		seen.add(current);
		chain.push(current);
		current = classes[current]?.superclass || null;
	}
	return chain;
}

/** Flattened IntelliSense view — does not mutate ClassGraph. */
export function flattenMembers(registry: ApiRegistry, className: string): {
	properties: PropertyDefinition[];
	methods: MethodDefinition[];
	events: EventDefinition[];
} {
	const order = [className, ...(registry.ancestors.get(className) || [])];
	const properties: PropertyDefinition[] = [];
	const methods: MethodDefinition[] = [];
	const events: EventDefinition[] = [];
	const seenProp = new Set<string>();
	const seenMethod = new Set<string>();
	const seenEvent = new Set<string>();
	for (const name of order) {
		const cls = registry.classes.get(name);
		if (!cls) {
			continue;
		}
		for (const p of cls.properties) {
			if (!seenProp.has(p.name)) {
				seenProp.add(p.name);
				properties.push(p);
			}
		}
		for (const m of cls.methods) {
			const key = `${m.name}#${m.overloadIndex}`;
			if (!seenMethod.has(key)) {
				seenMethod.add(key);
				methods.push(m);
			}
		}
		for (const e of cls.events) {
			if (!seenEvent.has(e.name)) {
				seenEvent.add(e.name);
				events.push(e);
			}
		}
	}
	return { properties, methods, events };
}

export function deriveServices(classes: Record<string, ClassDefinition>): Record<string, ServiceDefinition> {
	const services: Record<string, ServiceDefinition> = {};
	for (const cls of Object.values(classes)) {
		if (!cls.service && !cls.creation.service) {
			continue;
		}
		services[cls.name] = {
			name: cls.name,
			className: cls.name,
			kind: "service",
			accessor: "game:GetService",
			singleton: true,
			type: { kind: "Class", name: cls.name },
		};
	}
	return services;
}

export function searchRegistry(registry: ApiRegistry, query: string, limit = 50): Array<{ kind: string; symbol: string }> {
	const q = query.toLowerCase();
	const hits: Array<{ kind: string; symbol: string }> = [];
	for (const name of registry.classes.keys()) {
		if (name.toLowerCase().includes(q)) {
			hits.push({ kind: "class", symbol: name });
		}
	}
	for (const name of registry.enums.keys()) {
		if (name.toLowerCase().includes(q)) {
			hits.push({ kind: "enum", symbol: name });
		}
	}
	for (const [key] of registry.members) {
		if (key.toLowerCase().includes(q)) {
			hits.push({ kind: "member", symbol: key });
		}
	}
	return hits.slice(0, limit);
}
