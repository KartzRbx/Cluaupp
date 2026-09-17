import { Link } from "react-router-dom";

const THEME_LABELS: Record<string, string> = {
	dark: "Dark Modern",
	tokyo: "Tokyo Night",
	dracula: "Dracula",
	nord: "Nord",
	carbon: "Carbon",
	light: "Light",
};

type Props = {
	page: "home" | "docs" | "start";
	theme: string;
	onTheme: (theme: string) => void;
};

export function SiteHeader({ page, theme, onTheme }: Props) {
	const logo = `${import.meta.env.BASE_URL}assets/logo.png`;
	return (
		<header className="site-header">
			<Link className="brand" to="/">
				<img src={logo} alt="" width={36} height={36} />
				Cluaupp
			</Link>
			<div className="nav-wrap">
				<nav className="nav-links" aria-label="Primary">
					<span className="nav-pill" aria-hidden="true" />
					<Link to="/" aria-current={page === "home" ? "page" : undefined}>
						Home
					</Link>
					<Link to="/docs" aria-current={page === "docs" ? "page" : undefined}>
						Docs
					</Link>
					<Link to="/docs/setup" aria-current={page === "start" ? "page" : undefined}>
						Get started
					</Link>
					<a href="https://kartzrbx.github.io/CLPP/">CL++</a>
					<a href="https://github.com/KartzRbx/Cluaupp">GitHub</a>
				</nav>
			</div>
			<div className="header-tools">
				<label className="sr-only" htmlFor="theme-select">
					Theme
				</label>
				<select
					id="theme-select"
					className="theme-switch"
					value={theme}
					aria-label="Theme"
					onChange={(event) => onTheme(event.target.value)}
				>
					{Object.entries(THEME_LABELS).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>
		</header>
	);
}
