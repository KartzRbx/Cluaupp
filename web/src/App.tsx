import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { HomePage } from "./pages/HomePage";
import { DocsPage } from "./pages/DocsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { bindHeaderPills } from "./lib/enhance";

const THEME_KEY = "cluaupp-theme";
const THEMES = ["dark", "tokyo", "dracula", "nord", "carbon", "light"];

function themeFromStore() {
	try {
		const stored = localStorage.getItem(THEME_KEY);
		if (stored && THEMES.includes(stored)) {
			return stored;
		}
	} catch {
		/* ignore */
	}
	return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function navPage(pathname: string): "home" | "docs" | "start" {
	if (pathname.startsWith("/docs/setup")) {
		return "start";
	}
	if (pathname.startsWith("/docs")) {
		return "docs";
	}
	return "home";
}

function Shell() {
	const location = useLocation();
	const navigate = useNavigate();
	const [theme, setTheme] = useState(themeFromStore);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* ignore */
		}
	}, [theme]);

	useEffect(() => {
		document.title = location.pathname.startsWith("/docs") ? "Docs · Cluaupp" : "Cluaupp";
		bindHeaderPills();
		window.scrollTo(0, 0);
	}, [location.pathname]);

	useEffect(() => {
		function onClick(event: MouseEvent) {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			const anchor = event.target instanceof Element ? event.target.closest("a") : null;
			if (!anchor || anchor.target === "_blank" || !anchor.href) {
				return;
			}
			const url = new URL(anchor.href, window.location.href);
			if (url.origin !== window.location.origin) {
				return;
			}
			if (url.hash && url.pathname === window.location.pathname) {
				return;
			}
			const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
			let path = url.pathname;
			if (base && path.startsWith(base)) {
				path = path.slice(base.length) || "/";
			}
			path = path.replace(/\.html$/, "") || "/";
			event.preventDefault();
			navigate(path + url.search + url.hash);
		}
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [navigate]);

	return (
		<>
			<a className="skip" href="#content">
				Skip to content
			</a>
			<SiteHeader page={navPage(location.pathname)} theme={theme} onTheme={setTheme} />
			<div className="page" id="content">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/docs" element={<DocsPage />} />
					<Route path="/docs/:slug" element={<DocsPage />} />
					<Route path="/intro" element={<Navigate to="/" replace />} />
					<Route path="/intro/*" element={<Navigate to="/" replace />} />
					<Route path="/getting-started" element={<Navigate to="/docs/setup" replace />} />
					<Route path="/learn" element={<Navigate to="/docs" replace />} />
					<Route path="/learn/*" element={<Navigate to="/docs" replace />} />
					<Route path="/guide/getting-started" element={<Navigate to="/docs/setup" replace />} />
					<Route path="/guide/oop" element={<Navigate to="/docs/structs" replace />} />
					<Route path="/guide/examples" element={<Navigate to="/docs/leaderstats" replace />} />
					<Route path="/guide/libraries" element={<Navigate to="/docs/libraries" replace />} />
					<Route path="/guide/print-cout" element={<Navigate to="/docs/strings" replace />} />
					<Route path="/guide/cli" element={<Navigate to="/docs/cli" replace />} />
					<Route path="/docs/intro" element={<Navigate to="/docs" replace />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</div>
			<SiteFooter />
		</>
	);
}

export function App() {
	const basename = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";
	return (
		<BrowserRouter basename={basename === "/" ? undefined : basename}>
			<Shell />
		</BrowserRouter>
	);
}
