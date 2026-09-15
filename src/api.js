"use strict";

const generated = require("./api.generated");

const INSTANCE_TYPES = new Set(generated.INSTANCE_TYPES);
const SERVICES = new Set(generated.SERVICES);
const METHODS = new Set(generated.METHODS);
const DATATYPES = new Set(generated.DATATYPES);

const LUAU_TYPES = {
	void: "()",
	int: "number",
	float: "number",
	double: "number",
	bool: "boolean",
	string: "string",
	auto: null,
};

function isInstanceType(name) {
	return INSTANCE_TYPES.has(name);
}

function isService(name) {
	return SERVICES.has(name);
}

function isMethod(name) {
	return METHODS.has(name);
}

function isDatatype(name) {
	return DATATYPES.has(name);
}

function luauType(name) {
	if (!name) {
		return null;
	}
	const cleaned = String(name).replace(/\*+$/, "").replace(/^const\s+/, "").replace(/^Enum::/, "Enum.");
	if (cleaned in LUAU_TYPES) {
		return LUAU_TYPES[cleaned];
	}
	return cleaned;
}

module.exports = {
	INSTANCE_TYPES,
	SERVICES,
	METHODS,
	DATATYPES,
	isInstanceType,
	isService,
	isMethod,
	isDatatype,
	luauType,
};
