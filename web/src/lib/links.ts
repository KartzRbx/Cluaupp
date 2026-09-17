export function rewriteDocLinks(html: string) {
	const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
	const home = base || "/";
	return String(html || "").replace(/href="([^"]+)"/g, (full, href: string) => {
		if (/^(https?:|mailto:|#)/i.test(href)) {
			return full;
		}
		if (href === "../index.html" || href === "./index.html" || href === "/index.html") {
			return `href="${home}"`;
		}
		const name = href.replace(/^\.\//, "").replace(/\.html$/, "").replace(/^.*\//, "");
		if (!name || name === "index") {
			return `href="${base}/docs"`;
		}
		return `href="${base}/docs/${name}"`;
	});
}
