import fs from "node:fs";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const pages = Boolean(process.env.GITHUB_ACTIONS || process.env.SITE_BASE);
const base = process.env.SITE_BASE || (pages ? "/Cluaupp" : "/");

const clppGrammar = JSON.parse(fs.readFileSync(new URL("./src/syntaxes/clpp.tmLanguage.json", import.meta.url), "utf8"));

export default defineConfig({
	site: "https://kartzrbx.github.io",
	base,
	outDir: "../site",
	trailingSlash: "always",
	integrations: [
		starlight({
			title: "Cluaupp",
			description: "CL++ toolchain for Roblox — clpp, Rojo, CluauppLibs.",
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
					],
				},
			},
			sidebar: [
				{
					label: "Start",
					items: [
						{ label: "Getting started", slug: "getting-started" },
						{ label: "Migration", slug: "migration" },
					],
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
						{ label: "Comparison", slug: "comparison" },
					],
				},
			],
		}),
	],
});
