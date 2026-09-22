/** Canonical Roblox API model for Cluaupp (RobloxTargetProfile schemaVersion 2). */

export const ROBLOX_TARGET_SCHEMA_VERSION = 2 as const;

export type CanonicalTypeKind =
	| "Primitive"
	| "Class"
	| "Enum"
	| "Datatype"
	| "Array"
	| "Dictionary"
	| "Map"
	| "Tuple"
	| "Function"
	| "Union"
	| "Intersection"
	| "Optional"
	| "GenericParameter"
	| "TypePack"
	| "Singleton"
	| "Unknown"
	| "Any"
	| "Never"
	| "Buffer"
	| "Vector"
	| "Unsupported";

export type CanonicalType =
	| { kind: "Primitive"; name: string }
	| { kind: "Class"; name: string }
	| { kind: "Enum"; name: string }
	| { kind: "Datatype"; name: string }
	| { kind: "Array"; element: CanonicalType }
	| { kind: "Dictionary"; key: CanonicalType; value: CanonicalType }
	| { kind: "Map"; key: CanonicalType; value: CanonicalType }
	| { kind: "Tuple"; elements: CanonicalType[] }
	| { kind: "Function"; parameters: CanonicalType[]; returns: CanonicalType[]; variadic?: boolean }
	| { kind: "Union"; members: CanonicalType[] }
	| { kind: "Intersection"; members: CanonicalType[] }
	| { kind: "Optional"; inner: CanonicalType }
	| { kind: "GenericParameter"; name: string }
	| { kind: "TypePack"; name: string }
	| { kind: "Singleton"; value: string | number | boolean }
	| { kind: "Unknown" }
	| { kind: "Any" }
	| { kind: "Never" }
	| { kind: "Buffer" }
	| { kind: "Vector" }
	| { kind: "Unsupported"; raw: string; reason: string };

export type DefaultKind = "Null" | "Boolean" | "Number" | "String" | "EnumItem" | "Literal" | "Unknown";

export interface ParameterDefinition {
	name: string;
	type: CanonicalType;
	optional: boolean;
	default?: string;
	defaultKind?: DefaultKind;
}

export type ThreadSafety = "Unsafe" | "ReadSafe" | "LocalSafe" | "Safe" | "Unknown";

export interface SecurityPair {
	read?: string;
	write?: string;
	call?: string;
	listen?: string;
	create?: string;
}

export interface DeprecationInfo {
	deprecated: boolean;
	message?: string;
	replacement?: string;
}

export interface PropertyDefinition {
	name: string;
	owner: string;
	valueType: CanonicalType;
	readable: boolean;
	writable: boolean;
	readSecurity?: string;
	writeSecurity?: string;
	/** Roblox Parallel Luau thread safety (from API dump). */
	threadSafety?: ThreadSafety;
	tags: string[];
	defaultValue?: string;
	description?: string;
	deprecated?: DeprecationInfo;
}

export interface MethodDefinition {
	name: string;
	owner: string;
	overloadIndex: number;
	parameters: ParameterDefinition[];
	returnTypes: CanonicalType[];
	canYield: boolean;
	security?: string;
	threadSafety?: ThreadSafety;
	tags: string[];
	deprecated?: DeprecationInfo;
	description?: string;
}

export interface EventDefinition {
	name: string;
	owner: string;
	parameters: ParameterDefinition[];
	listenSecurity?: string;
	threadSafety?: ThreadSafety;
	tags: string[];
	description?: string;
	deprecated?: DeprecationInfo;
}

export interface CallbackDefinition {
	name: string;
	owner: string;
	parameters: ParameterDefinition[];
	returnTypes: CanonicalType[];
	canYield: boolean;
	security?: string;
	threadSafety?: ThreadSafety;
	tags: string[];
	description?: string;
	deprecated?: DeprecationInfo;
}

export interface ConstructorDefinition {
	owner: string;
	overloadIndex: number;
	parameters: ParameterDefinition[];
	tags: string[];
}

export type CreationKind = "creatable" | "service" | "abstract" | "pluginOnly" | "unknown";

export interface CreationPolicy {
	kind: CreationKind;
	creatable: boolean;
	service: boolean;
	abstract: boolean;
	pluginOnly: boolean;
	security?: string;
	notes?: string;
}

export interface ClassDefinition {
	name: string;
	superclass: string | null;
	subclasses: string[];
	tags: string[];
	description?: string;
	deprecated?: DeprecationInfo;
	security?: SecurityPair;
	creatable: boolean;
	service: boolean;
	preferredParent?: string;
	creation: CreationPolicy;
	properties: PropertyDefinition[];
	methods: MethodDefinition[];
	events: EventDefinition[];
	callbacks: CallbackDefinition[];
	constructors: ConstructorDefinition[];
}

export interface EnumItemDefinition {
	name: string;
	numericValue: number;
	description?: string;
	tags: string[];
	deprecated?: DeprecationInfo;
}

export interface EnumDefinition {
	name: string;
	description?: string;
	items: EnumItemDefinition[];
	tags: string[];
}

export interface DatatypeDefinition {
	name: string;
	summary?: string;
	fields: Array<{ name: string; type: CanonicalType }>;
	constructors: ConstructorDefinition[];
	staticProperties: string[];
	staticMethods: MethodDefinition[];
	instanceMethods: MethodDefinition[];
	source: "dump" | "override" | "inferred";
}

export interface ServiceDefinition {
	name: string;
	className: string;
	kind: "service";
	accessor: string;
	singleton: true;
	type: CanonicalType;
}

export interface GlobalDefinition {
	name: string;
	type: CanonicalType;
	layer: "luau-core" | "roblox-engine" | "cluaupp-runtime";
	description?: string;
}

export interface LibraryDefinition {
	name: string;
	layer: "luau-core" | "roblox-engine" | "cluaupp-runtime";
	bind?: string;
	file?: string;
}

export interface UnsupportedRepresentation {
	symbol: string;
	source: string;
	reason: string;
	fallback: string;
	severity: "error" | "warning" | "info";
}

export interface SourceMeta {
	id: string;
	path?: string;
	hash: string;
	loadedAt: string;
	version?: string | number;
}

export interface RobloxTargetProfile {
	target: "roblox";
	schemaVersion: typeof ROBLOX_TARGET_SCHEMA_VERSION;
	robloxApiVersion?: string;
	studioVersion?: string;
	generatorVersion: string;
	sources: Record<string, SourceMeta>;
	classes: Record<string, ClassDefinition>;
	enums: Record<string, EnumDefinition>;
	datatypes: Record<string, DatatypeDefinition>;
	globals: Record<string, GlobalDefinition>;
	libraries: Record<string, LibraryDefinition>;
	services: Record<string, ServiceDefinition>;
	aliases: Record<string, string>;
	constructors: Record<string, ConstructorDefinition[]>;
	security: Record<string, SecurityPair>;
	deprecations: Record<string, DeprecationInfo>;
	unsupported: UnsupportedRepresentation[];
}

export interface OverrideEntry {
	reason: string;
	source: string;
	introducedAt: string;
	reviewAfter?: string;
}

export type DiffKind =
	| "ADDED_CLASS"
	| "REMOVED_CLASS"
	| "CHANGED_SUPERCLASS"
	| "ADDED_PROPERTY"
	| "REMOVED_PROPERTY"
	| "CHANGED_PROPERTY_TYPE"
	| "ADDED_METHOD_OVERLOAD"
	| "REMOVED_METHOD_OVERLOAD"
	| "ADDED_EVENT"
	| "CHANGED_EVENT_SIGNATURE"
	| "ADDED_ENUM"
	| "REMOVED_ENUM"
	| "ADDED_ENUM_ITEM"
	| "REMOVED_ENUM_ITEM"
	| "DEPRECATED_MEMBER";

export interface ApiDiffEntry {
	kind: DiffKind;
	symbol: string;
	oldValue?: string;
	newValue?: string;
}
