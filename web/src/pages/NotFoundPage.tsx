import { Link } from "react-router-dom";

export function NotFoundPage() {
	return (
		<article className="docs-article">
			<h1>Not found</h1>
			<p className="muted">That page is gone. Start at the handbook.</p>
			<p>
				<Link className="btn btn-primary" to="/">
					Home
				</Link>{" "}
				<Link className="btn btn-ghost" to="/docs">
					Docs
				</Link>
			</p>
		</article>
	);
}
