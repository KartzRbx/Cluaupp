import { createDocsPages, groupDocs } from "./docs";
import { codePair, escapeHtml, mappingTable, preCode } from "../lib/html";
import { pageHref } from "../lib/headings";

export const docsPages = createDocsPages({ codePair, preCode, escapeHtml, mappingTable });
export const docsGroups = groupDocs(docsPages);

export function findDocsPage(slug: string | undefined) {
	if (!slug || slug === "index" || slug === "intro") {
		return docsPages[0];
	}
	const clean = slug.replace(/\.html$/, "");
	return docsPages.find((page) => page.id === clean || page.file === `${clean}.html`) ?? null;
}

export function docsNavItems() {
	return docsGroups.map((group) => ({
		name: group.name,
		items: group.items.map((page) => ({
			id: page.id,
			title: page.title,
			href: pageHref(page.id),
		})),
	}));
}
