import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { docsNavItems, findDocsPage } from "../content/catalog";
import { VueDocsRail } from "../components/VueDocsRail";
import { withHeadingIds } from "../lib/headings";
import { rewriteDocLinks } from "../lib/links";
import { bindPageEnhancements } from "../lib/enhance";
import { pageHref } from "../lib/headings";

export function DocsPage() {
	const { slug } = useParams();
	const page = findDocsPage(slug);
	const groups = useMemo(() => {
		const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
		return docsNavItems().map((group) => ({
			...group,
			items: group.items.map((item) => ({
				...item,
				href: `${base}${pageHref(item.id)}`,
			})),
		}));
	}, []);
	const headed = useMemo(() => {
		if (!page) {
			return { html: "", headings: [] };
		}
		return withHeadingIds(rewriteDocLinks(page.inner));
	}, [page]);
	const [activeHeading, setActiveHeading] = useState(headed.headings[0]?.id ?? "");

	useEffect(() => {
		setActiveHeading(headed.headings[0]?.id ?? "");
		const article = document.querySelector(".docs-article");
		if (!(article instanceof HTMLElement)) {
			return;
		}
		return bindPageEnhancements(article, headed.headings, setActiveHeading);
	}, [headed]);

	if (!page) {
		return <Navigate to="/docs" replace />;
	}

	return (
		<main className="docs">
			<article className="docs-article">
				<div className="crumb">
					<Link to="/">Cluaupp</Link> / {page.title}
				</div>
				<h1>{page.title}</h1>
				<div dangerouslySetInnerHTML={{ __html: headed.html }} />
			</article>
			<VueDocsRail
				headings={headed.headings}
				groups={groups}
				currentId={page.id}
				activeHeading={activeHeading}
			/>
		</main>
	);
}
