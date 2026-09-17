import type { Heading } from "./types";

export function slugify(text: string) {
	return text
		.replace(/&[a-z]+;/gi, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function withHeadingIds(html: string) {
	const used = new Set<string>();
	const headings: Heading[] = [];
	const next = String(html || "").replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
		const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
		let id = slugify(text) || `section-${headings.length + 1}`;
		if (used.has(id)) {
			id = `${id}-${headings.length + 1}`;
		}
		used.add(id);
		headings.push({ level: Number(level), id, text });
		return `<h${level} id="${id}">${inner}</h${level}>`;
	});
	return { html: next, headings };
}

export function pageHref(id: string) {
	return id === "intro" ? "/docs" : `/docs/${id}`;
}
