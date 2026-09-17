import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(webRoot, "..");
const outDir = path.join(repoRoot, "site");

const extraHtmlPaths = [
	"404.html",
	"intro.html",
	"intro/index.html",
	"getting-started.html",
	"learn/index.html",
	"guide/getting-started.html",
	"guide/oop.html",
	"guide/examples.html",
	"guide/libraries.html",
	"guide/print-cout.html",
	"guide/cli.html",
	"docs/intro.html",
];

function writeCopy(rel: string, index: string) {
	const dest = path.join(outDir, rel);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.writeFileSync(dest, index);
}

function spaFallbacks() {
	return {
		name: "cluaupp-spa-fallbacks",
		closeBundle() {
			const indexPath = path.join(outDir, "index.html");
			if (!fs.existsSync(indexPath)) {
				return;
			}
			const index = fs.readFileSync(indexPath, "utf8");
			fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
			fs.rmSync(path.join(outDir, "api"), { recursive: true, force: true });
			for (const leftover of ["assets/style.css", "assets/app.js"]) {
				fs.rmSync(path.join(outDir, leftover), { force: true });
			}
			for (const rel of extraHtmlPaths) {
				writeCopy(rel, index);
			}
			const source = fs.readFileSync(path.join(webRoot, "src", "content", "docs.ts"), "utf8");
			const ids = [...source.matchAll(/page\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g)];
			for (const match of ids) {
				const id = match[1];
				const file = match[2];
				writeCopy(path.join("docs", file), index);
				if (id !== "intro") {
					writeCopy(path.join("docs", id, "index.html"), index);
				}
			}
		},
	};
}

const pages = Boolean(process.env.GITHUB_ACTIONS || process.env.SITE_BASE);
const base = process.env.SITE_BASE || (pages ? "/Cluaupp/" : "/");

export default defineConfig({
	root: webRoot,
	base,
	publicDir: path.join(webRoot, "public"),
	plugins: [react(), vue(), spaFallbacks()],
	build: {
		outDir,
		emptyOutDir: true,
		assetsDir: "assets",
	},
	server: {
		port: 5173,
	},
});
