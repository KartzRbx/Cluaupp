import fs from "node:fs";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";
import starlight from "@astrojs/starlight";

const pages = Boolean(process.env.GITHUB_ACTIONS || process.env.SITE_BASE);
const base = process.env.SITE_BASE || (pages ? "/Cluaupp" : "/");

const clppGrammar = JSON.parse(fs.readFileSync(new URL("./src/syntaxes/clpp.tmLanguage.json", import.meta.url), "utf8"));
const flareGrammar = JSON.parse(fs.readFileSync(new URL("../editors/vscode/syntaxes/flare.tmLanguage.json", import.meta.url), "utf8"));
const schemaGrammar = JSON.parse(fs.readFileSync(new URL("../editors/vscode/syntaxes/schema.tmLanguage.json", import.meta.url), "utf8"));

export default defineConfig({
	site: "https://kartzrbx.github.io",
	base,
	outDir: "../site",
	trailingSlash: "always",
	integrations: [
		// Must run before Starlight so ```mermaid fences become live charts.
		mermaid({
			autoTheme: true,
			mermaidConfig: {
				themeVariables: {
					fontFamily: "var(--sl-font)",
				},
			},
		}),
		starlight({
			title: "Cluaupp",
			description: "CL++ Roblox project host — Context Safety, API Registry, Flare, Rojo.",
			favicon: "/assets/logo.png",
			logo: {
				src: "./src/assets/logo.png",
				alt: "Cluaupp",
			},
			social: [
				{ icon: "github", label: "GitHub", href: "https://github.com/KartzRbx/Cluaupp" },
			],
			editLink: {
				baseUrl: "https://github.com/KartzRbx/Cluaupp/edit/main/docs/",
			},
			customCss: ["./src/styles/custom.css"],
			expressiveCode: {
				themes: ["houston", "github-light"],
				shiki: {
					langs: [
						{
							...clppGrammar,
							name: "clpp",
							displayName: "CL++",
							aliases: ["clp", "clh"],
						},
						{
							...flareGrammar,
							name: "flare",
							displayName: "Flare",
						},
						{
							...schemaGrammar,
							name: "hive",
							displayName: "Hive",
							aliases: ["mint", "bloom", "helm", "shift", "axiom", "cluaupp-schema"],
						},
					],
				},
			},
			sidebar: [
				{
					label: "Start",
					items: [
						{ label: "Getting started", slug: "getting-started" },
						{ label: "Why Cluaupp", slug: "why-cluaupp" },
						{ label: "Benchmarks", slug: "benchmarks" },
						{ label: "Comparison", slug: "comparison" },
						{ label: "Migration", slug: "migration" },
						{ label: "Roadmap", slug: "roadmap" },
					],
				},
				{
					label: "Architecture",
					autogenerate: { directory: "architecture" },
				},
				{
					label: "CLI",
					autogenerate: { directory: "cli" },
				},
				{
					label: "Language",
					autogenerate: { directory: "language" },
				},
				{
					label: "Internals",
					autogenerate: { directory: "internals" },
				},
				{
					label: "Libraries",
					autogenerate: { directory: "libraries" },
				},
				{
					label: "Examples",
					autogenerate: { directory: "examples" },
				},
				{
					label: "Reference",
					items: [
						{ label: "Roblox API", slug: "engine" },
						{ label: "Roblox reference", slug: "reference/roblox" },
					],
				},
			],
		}),
	],
});
