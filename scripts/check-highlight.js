"use strict";

const fs = require("fs");
const path = require("path");
const { visibleText } = require("./highlight");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "site");

function walk(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full, files);
		} else if (entry.name.endsWith(".html")) {
			files.push(full);
		}
	}
	return files;
}

const files = walk(SITE);
const leaks = [];
let blocks = 0;

for (const file of files) {
	const html = fs.readFileSync(file, "utf8");
	const re = /<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
	let match;
	while ((match = re.exec(html))) {
		blocks += 1;
		const inner = match[2];
		const visible = visibleText(inner);
		const rel = path.relative(ROOT, file).replace(/\\/g, "/");
		if (/class="tok-/.test(visible) || /new class=/.test(visible) || /data-tok=/.test(visible)) {
			leaks.push(`${rel}: highlighter markup leaked into visible text\n${visible.slice(0, 280)}`);
		}
	}
}

if (leaks.length) {
	console.error(`highlight check failed (${leaks.length} of ${blocks} blocks)`);
	console.error(leaks.slice(0, 12).join("\n\n"));
	process.exit(1);
}

console.log(`highlight ok: ${blocks} <pre> blocks in ${files.length} html files`);
