"use strict";

const fs = require("fs");
const path = require("path");

const RUNTIME = path.join(__dirname, "..", "runtime");

function nestImpl(libName) {
	const root = path.join(RUNTIME, libName);
	if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
		throw new Error("missing library folder " + libName);
	}
	const impl = path.join(root, "_impl");
	if (fs.existsSync(impl)) {
		console.log("skip nest, already has _impl:", libName);
		return;
	}
	const staging = path.join(root, "__impl_staging");
	fs.mkdirSync(staging, { recursive: true });
	for (const name of fs.readdirSync(root)) {
		if (name === "__impl_staging") {
			continue;
		}
		fs.renameSync(path.join(root, name), path.join(staging, name));
	}
	fs.renameSync(staging, impl);
	console.log("nested", libName);
}

for (const name of [
	"Promise",
	"Janitor",
	"Fusion",
	"Iris",
	"Cmdr",
	"Chrono",
	"FormatNumber",
	"TopbarPlus",
	"EzVisualz",
	"StateMachine",
	"Module3D",
	"Display",
	"Spring",
]) {
	nestImpl(name);
}

const janitorImpl = path.join(RUNTIME, "Janitor", "_impl");
const stubPromise = path.join(janitorImpl, "Promise.luau");
if (fs.existsSync(stubPromise)) {
	fs.unlinkSync(stubPromise);
	console.log("removed Janitor/_impl/Promise.luau");
}

const janitorInit = path.join(janitorImpl, "init.luau");
if (fs.existsSync(janitorInit)) {
	let text = fs.readFileSync(janitorInit, "utf8");
	text = text.replace(
		'local Promise = require(script.Promise)',
		'local Promise = require(script.Parent.Parent.Promise)',
	);
	fs.writeFileSync(janitorInit, text);
	console.log("patched Janitor/_impl Promise require");
}
