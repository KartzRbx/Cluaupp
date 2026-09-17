import { docsPages } from "./content/catalog";
import { visibleText } from "./lib/highlight";

const leaks: string[] = [];
let blocks = 0;

for (const page of docsPages) {
	const re = /<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(page.inner))) {
		blocks += 1;
		const visible = visibleText(match[2]);
		if (/class="tok-/.test(visible) || /new class=/.test(visible) || /data-tok=/.test(visible)) {
			leaks.push(`${page.file}: highlighter markup leaked into visible text\n${visible.slice(0, 280)}`);
		}
	}
}

if (leaks.length) {
	console.error(`highlight check failed (${leaks.length} of ${blocks} blocks)`);
	console.error(leaks.slice(0, 12).join("\n\n"));
	process.exit(1);
}

console.log(`highlight ok: ${blocks} <pre> blocks in ${docsPages.length} handbook pages`);
