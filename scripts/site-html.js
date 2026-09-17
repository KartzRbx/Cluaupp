"use strict";

const { preCode } = require("./highlight");
const { createGuides } = require("./site-guides");
const { createDocsPages, docsNav } = require("./site-docs");

const ASSET_V = "7";

let pairSeq = 0;

function escapeHtml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function codePair(cpp, luau) {
	pairSeq += 1;
	const id = `pair-${pairSeq}`;
	return `<div class="pair" data-tabs>
	<div class="pair-tabs">
		<span class="tab-ink" aria-hidden="true"></span>
		<button type="button" role="tab" aria-selected="true" aria-controls="${id}-cpp" id="${id}-tab-cpp">C++</button>
		<button type="button" role="tab" aria-selected="false" aria-controls="${id}-luau" id="${id}-tab-luau" tabindex="-1">Luau</button>
	</div>
	<div class="pair-panel" role="tabpanel" id="${id}-cpp" aria-labelledby="${id}-tab-cpp">${preCode(cpp, "cpp")}</div>
	<div class="pair-panel" role="tabpanel" id="${id}-luau" aria-labelledby="${id}-tab-luau" hidden>${preCode(luau, "luau")}</div>
</div>`;
}

function mappingTable() {
	return `<table>
<tr><th>C++</th><th>Luau</th></tr>
<tr><td><code>int</code> / <code>float</code> / <code>double</code></td><td><code>number</code></td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td></tr>
<tr><td><code>string</code></td><td><code>string</code></td></tr>
<tr><td><code>const int N = 1</code></td><td><code>const N: number = 1</code></td></tr>
<tr><td><code>Part*</code> / <code>auto*</code></td><td><code>Part</code> (Instance handle)</td></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>CFrame::lookAt(from, look)</code></td><td><code>CFrame.lookAt(from, look)</code></td></tr>
<tr><td><code>UDim2::fromScale(1, 1)</code></td><td><code>UDim2.fromScale(1, 1)</code></td></tr>
<tr><td><code>Color3::fromRGB(255, 0, 0)</code></td><td><code>Color3.fromRGB(255, 0, 0)</code></td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td><code>Enum.Material.Plastic</code></td></tr>
<tr><td><code>new Part(workspace)</code></td><td><code>Instance.new("Part")</code> + <code>.Parent</code></td></tr>
<tr><td><code>part-&gt;Position</code></td><td><code>part.Position</code></td></tr>
<tr><td><code>player-&gt;FindFirstChild("x")</code></td><td><code>player:FindFirstChild("x")</code></td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>new Janitor()</code></td><td><code>Janitor.new()</code></td></tr>
<tr><td><code>Net::Event("Coins")</code></td><td><code>Net.Event("Coins")</code></td></tr>
<tr><td><code>janitor-&gt;Add(conn)</code></td><td><code>janitor:Add(conn)</code></td></tr>
<tr><td><code>nullptr</code></td><td><code>nil</code></td></tr>
<tr><td><code>!=</code> <code>&amp;&amp;</code> <code>||</code></td><td><code>~=</code> <code>and</code> <code>or</code></td></tr>
</table>`;
}

function rbxIcon(kind) {
	const icons = {
		game: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#9a9a9a" d="M8 1.2 14.8 8 8 14.8 1.2 8z"/><path fill="#6e6e6e" d="M8 4.2 11.8 8 8 11.8 4.2 8z"/></svg>`,
		folder: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#e8b923" d="M1.5 3.5h5l1.2 1.5H14.5v8.5h-13z"/><path fill="#f5cd2f" d="M1.5 6h13v7.5h-13z"/></svg>`,
		script: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M4 1.5h6.2L13 4.3V14.5H4z"/><path fill="#d9d9d9" d="M10.2 1.5V4.3H13"/><path fill="#00a2ff" d="M5.5 7h5v1.2h-5zm0 2.2h5V10.4h-5zm0 2.2h3.4v1.2H5.5z"/></svg>`,
		localscript: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M4 1.5h6.2L13 4.3V14.5H4z"/><path fill="#d9d9d9" d="M10.2 1.5V4.3H13"/><path fill="#00a2ff" d="M6.2 7.1 11 9.6 6.2 12.1z"/></svg>`,
		module: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#8c5a32" d="M8 2 14 5.2v5.6L8 14 2 10.8V5.2z"/><path fill="#c48a4a" d="M8 2v12L2 10.8V5.2z"/><path fill="#a86b38" d="M8 2 14 5.2 8 8.2 2 5.2z"/></svg>`,
		cpp: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#3c82c8" d="M3 2h7.2L13 5v9H3z"/><path fill="#2a5f96" d="M10.2 2V5H13"/><text x="8" y="12" text-anchor="middle" fill="#fff" font-size="5.5" font-family="Arial,sans-serif">C+</text></svg>`,
		header: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#6a9955" d="M3 2h7.2L13 5v9H3z"/><path fill="#4e7a3c" d="M10.2 2V5H13"/><text x="8" y="12" text-anchor="middle" fill="#fff" font-size="6" font-family="Arial,sans-serif">H</text></svg>`,
		sss: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#4a90d9" d="M2 3h5l1 1.4H14v8.6H2z"/><path fill="#00a2ff" d="M2 5.4h12V13H2z"/></svg>`,
		rs: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="#6c9a3a" d="M2 3h5l1 1.4H14v8.6H2z"/><path fill="#8fbf4a" d="M2 5.4h12V13H2z"/></svg>`,
		player: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="5" r="2.4" fill="#f5cd2f"/><path fill="#f5cd2f" d="M3.5 13.2c.4-3 2.2-4.4 4.5-4.4s4.1 1.4 4.5 4.4z"/></svg>`,
	};
	return icons[kind] || icons.folder;
}

function exRow(kind, name, klass) {
	const klassHtml = klass ? `<span class="ex-kind">${escapeHtml(klass)}</span>` : "";
	return `<span class="ex-icon">${rbxIcon(kind)}</span><span class="ex-name">${escapeHtml(name)}</span>${klassHtml}`;
}

function exLeaf(kind, name, klass) {
	return `<li class="ex-leaf"><div class="ex-row">${exRow(kind, name, klass)}</div></li>`;
}

function exBranch(kind, name, klass, children, open = true) {
	return `<li class="ex-branch"><details${open ? " open" : ""}><summary class="ex-row">${exRow(kind, name, klass)}</summary><ul class="ex-children">${children.join("")}</ul></details></li>`;
}

function explorerPane(title, items) {
	return `<div class="explorer">
	<div class="explorer-title">${escapeHtml(title)}</div>
	<ul class="ex-root">${items.join("")}</ul>
</div>`;
}

function sourceExplorer() {
	return explorerPane("Disk · src/", [
		exBranch("folder", "src", "Folder", [
			exBranch("folder", "server", "Folder", [exLeaf("cpp", "leaderstats.server.cpp", "Script source")]),
			exBranch("folder", "client", "Folder", [exLeaf("cpp", "hud.client.cpp", "LocalScript source")]),
			exBranch("folder", "shared", "Folder", [exLeaf("header", "config.h", "Module source")]),
		]),
	]);
}

function studioExplorer() {
	return explorerPane("Studio · Explorer", [
		exBranch("game", "game", "DataModel", [
			exBranch("sss", "ServerScriptService", "ServerScriptService", [
				exBranch("folder", "Cluaupp", "Folder", [
					exLeaf("script", "leaderstats.server", "Script"),
				]),
			]),
			exBranch("rs", "ReplicatedStorage", "ReplicatedStorage", [
				exBranch("folder", "Cluaupp", "Folder", [exLeaf("module", "Config", "ModuleScript")]),
				exBranch("folder", "CluauppLibs", "Folder", [
					exLeaf("module", "Janitor", "ModuleScript"),
					exLeaf("module", "Net", "ModuleScript"),
					exLeaf("module", "Promise", "ModuleScript"),
					exLeaf("module", "DataService", "ModuleScript"),
				], false),
			]),
			exBranch("player", "StarterPlayer", "StarterPlayer", [
				exBranch("folder", "StarterPlayerScripts", "StarterPlayerScripts", [
					exBranch("folder", "Cluaupp", "Folder", [
						exLeaf("localscript", "hud.client", "LocalScript"),
					]),
				]),
			]),
		]),
	]);
}

function serviceExplorers() {
	return `<div class="explorer-stage">
	${explorerPane("Disk · out/server/LeaderStats/", [
		exLeaf("script", "init.luau", "Script + RunContext Server"),
		exLeaf("script", "init.meta.json", "className Script"),
		exLeaf("module", "Main.luau", "ModuleScript child"),
		exLeaf("module", "PlayersManager.luau", "ModuleScript child"),
		exLeaf("module", "CacheController.luau", "ModuleScript child"),
		exLeaf("module", "LeaderStatsTypes.luau", "ModuleScript child"),
	])}
	<p class="explorer-flow" aria-hidden="true"><span>Rojo init</span><span class="explorer-arrow">→</span></p>
	${explorerPane("Studio · ServerScriptService.Cluaupp", [
		exBranch("script", "LeaderStats", "Script", [
			exLeaf("module", "Main", "ModuleScript"),
			exLeaf("module", "PlayersManager", "ModuleScript"),
			exLeaf("module", "CacheController", "ModuleScript"),
			exLeaf("module", "LeaderStatsTypes", "ModuleScript"),
		]),
	])}
</div>`;
}

function studioStage() {
	return `<div class="explorer-stage">
	${sourceExplorer()}
	<p class="explorer-flow" aria-hidden="true"><span>cluaupp build</span><span>rojo serve</span><span class="explorer-arrow">→</span></p>
	${studioExplorer()}
</div>`;
}

function learnNextBar(id) {
	const lessons = [
		["learn-overview", "Overview"],
		["learn-basics", "Basics"],
		["learn-cpp", "C++ subset"],
		["learn-luau", "Luau output"],
		["learn-mapping", "Mapping"],
		["learn-types", "Types and safety"],
		["learn-org", "Organization"],
		["learn-arch", "One file out"],
		["learn-oop", "OOP structure"],
		["learn-libs", "Libraries"],
		["learn-cout", "print / cout"],
		["learn-examples", "Examples"],
		["learn-practice", "Best practices"],
	];
	const index = lessons.findIndex((item) => item[0] === id);
	const next = lessons[index + 1];
	if (!next) {
		return `<div class="learn-next"><a class="btn btn-primary" href="../guide/getting-started.html">Next · Get started</a></div>`;
	}
	return `<div class="learn-next"><button type="button" class="btn btn-primary" data-learn-next="${next[0]}">Next lesson · ${escapeHtml(next[1])}</button></div>`;
}

function guides() {
	if (!guides._cache) {
		guides._cache = createGuides({ codePair, preCode, escapeHtml });
	}
	return guides._cache;
}

function guideArticle(title, inner) {
	return `<article class="docs-article"><div class="crumb"><a href="../index.html">Cluaupp</a> / ${escapeHtml(title)}</div><h1>${escapeHtml(title)}</h1>${inner}</article>`;
}

function slugify(text) {
	return String(text)
		.replace(/<[^>]+>/g, "")
		.replace(/&[a-z]+;/gi, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

function withHeadingIds(html) {
	const used = new Set();
	const headings = [];
	const next = String(html || "").replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
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

function pageToc(headings) {
	if (!headings || headings.length === 0) {
		return "";
	}
	const items = headings
		.map((item) => `<li class="toc-h${item.level}"><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`)
		.join("");
	return `<nav class="page-toc" aria-label="On this page"><h2>On this page</h2><ul>${items}</ul></nav>`;
}

function navItem(href, label, page, id) {
	const current = page === id ? ' aria-current="page"' : "";
	return `<a href="${href}"${current}>${label}</a>`;
}

function localLayout(title, body, sidebar, depth, page = "") {
	const prefix = depth === 0 ? "./" : "../".repeat(depth);
	const inner = sidebar
		? `<main class="docs"><article class="docs-article">${body}</article><aside class="docs-rail">${sidebar}</aside></main>`
		: body;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Cluaupp</title>
<link rel="icon" href="${prefix}assets/logo.png">
<link rel="stylesheet" href="${prefix}assets/style.css?v=${ASSET_V}">
<script>
(function(){try{var t=localStorage.getItem("cluaupp-theme");if(!t)t=matchMedia("(prefers-color-scheme:light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();
</script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site-header">
  <a class="brand" href="${prefix}index.html"><img src="${prefix}assets/logo.png" alt="" width="36" height="36">Cluaupp</a>
  <div class="nav-wrap">
    <nav class="nav-links" aria-label="Primary">
      <span class="nav-pill" aria-hidden="true"></span>
      ${navItem(`${prefix}index.html`, "Home", page, "home")}
      ${navItem(`${prefix}docs/index.html`, "Docs", page, "docs")}
      ${navItem(`${prefix}docs/setup.html`, "Get started", page, "start")}
      <a href="https://github.com/KartzRbx/Cluaupp">GitHub</a>
    </nav>
  </div>
  <div class="header-tools">
    <label class="sr-only" for="theme-select">Theme</label>
    <select id="theme-select" class="theme-switch" data-theme-select aria-label="Theme">
      <option value="dark">Dark Modern</option>
      <option value="tokyo">Tokyo Night</option>
      <option value="dracula">Dracula</option>
      <option value="nord">Nord</option>
      <option value="carbon">Carbon</option>
      <option value="light">Light</option>
    </select>
  </div>
</header>
<div class="page" id="content">${inner}</div>
<footer class="site-footer">
  <span>Cluaupp — C++ × Luau</span>
  <span><a href="https://github.com/KartzRbx/Cluaupp">GitHub</a> · <a href="https://create.roblox.com/docs/reference/engine">Roblox engine</a></span>
</footer>
<script src="${prefix}assets/app.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function homeBody() {
	return `
<section class="hero">
  <div class="hero-copy reveal">
    <p class="eyebrow">C++ × Luau</p>
    <h1>A TypeScript-to-Luau compiler<br>for people who write C++.</h1>
    <p class="lede">Cluaupp is a C++ subset that compiles to readable Roblox Luau. clangd completes. Filename tags pick Script / LocalScript / ModuleScript. You write structs, methods, and <code>init()</code> — not an API dump. The docs are the language: every construct the CLI accepts.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="docs/setup.html">Get started</a>
      <a class="btn btn-ghost" href="docs/index.html">Docs</a>
    </div>
  </div>
  <img class="hero-logo" src="./assets/logo.png" alt="Cluaupp mark">
</section>
<section class="section" data-reveal>
  ${codePair(
		`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include "LeaderstatsServer.h"

void init() {
	Players* players = GetService<Players>();
	LeaderstatsServer leaderstatsServer;
	leaderstatsServer.janitor = new Janitor();
	for (Player* player : players->GetPlayers()) {
		leaderstatsServer.PlayerEntered(player);
	}
	players->PlayerAdded.Connect([&](Player* playerEntered) {
		leaderstatsServer.PlayerEntered(playerEntered);
	});
}`,
		`local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)
local LeaderstatsServer = {}

const function init()
	local players: Players = game:GetService("Players")
	local leaderstatsServer: LeaderstatsServer = LeaderstatsServer
	leaderstatsServer.janitor = Janitor.new()
	for _, player in players:GetPlayers() do
		leaderstatsServer:PlayerEntered(player)
	end
	players.PlayerAdded:Connect(function(playerEntered: Player)
		leaderstatsServer:PlayerEntered(playerEntered)
	end)
end

init()`,
	)}
</section>
<section class="section" data-reveal>
  <div class="grid">
    <a class="card" href="docs/reference.html"><strong>Every construct</strong><span class="muted">Strings, string_concat, functions, scopes, structs, callbacks, singletons, includes, the CLI — the handbook is the language, not a class dump.</span></a>
    <a class="card" href="docs/structs.html"><strong>Types you own</strong><span class="muted">A struct in the header, Class:: methods in the .cpp, void init() to boot. Same pattern for Template data and services.</span></a>
    <a class="card" href="docs/cli.html"><strong>clangd + Rojo</strong><span class="muted">init, build, watch, lsp, intellisense. Filename tags pick Script / LocalScript / ModuleScript. First-party libs require themselves.</span></a>
  </div>
</section>
`;
}

function introBody(p) {
	return `<article class="docs-article">
<div class="crumb"><a href="${p}index.html">Cluaupp</a> / Intro</div>
<p class="eyebrow">C++ × Luau</p>
<h1>Cluaupp</h1>
<p class="lede">The definitive merge of C++ and modern Luau. You write a C++ subset. Cluaupp emits Luau with <code>local</code> and <code>const</code> (and <code>--!strict</code> when you opt in), and calls the Roblox API the way Studio does.</p>
<p>This page is the old Moonwave <code>/intro</code> route. The public site is this cinematic dump — not ISO C++, not WASM.</p>
<div class="hero-actions">
  <a class="btn btn-primary" href="${p}docs/index.html">Read the docs</a>
  <a class="btn btn-ghost" href="${p}docs/setup.html">Get started</a>
</div>
<h2>What you get</h2>
<ol>
<li>A compiler (<code>cluaupp init</code> / <code>build</code> / <code>watch</code>)</li>
<li>clangd IntelliSense via <code>#include &lt;cluaupp/roblox.hpp&gt;</code> (not a second completion engine)</li>
<li>First-party libraries in <code>ReplicatedStorage.CluauppLibs</code></li>
<li>Optional Wally only for extra community packages</li>
</ol>
<h2>First program</h2>
${codePair(
	`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>

void OnPlayer(Player* player) {
	auto* janitor = new Janitor();
	janitor->LinkToInstance(player);
	janitor->Add(player->AncestryChanged.Connect(OnPlayer));
}

void init() {
	auto* players = GetService<Players>();
	players->PlayerAdded.Connect(OnPlayer);
}`,
	`--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)

local function OnPlayer(player: Player)
	local janitor = Janitor.new()
	janitor:LinkToInstance(player)
	janitor:Add(player.AncestryChanged:Connect(OnPlayer))
end

local function init()
	local players: Players = game:GetService("Players")
	players.PlayerAdded:Connect(OnPlayer)
end

init()`,
)}
<p>Next: <a href="${p}docs/setup.html">Setup</a>, then the <a href="${p}docs/index.html">language handbook</a>.</p>
</article>`;
}

function movedBody(p, href, label) {
	return `<article class="docs-article">
<h1>Moved</h1>
<p>This Moonwave URL now lives at <a href="${href}">${label}</a>.</p>
<meta http-equiv="refresh" content="0; url=${href}">
<p><a class="btn btn-primary" href="${href}">Continue</a></p>
</article>`;
}

function learnPanel(id, selected, title, inner) {
	return `<section class="learn-panel" role="tabpanel" id="${id}" aria-labelledby="${id}-tab"${selected ? "" : " hidden"}>
	<h1>${title}</h1>
	${inner}
	${learnNextBar(id)}
</section>`;
}

function learnTab(id, selected, label) {
	return `<button type="button" role="tab" id="${id}-tab" aria-controls="${id}" aria-selected="${selected ? "true" : "false"}"${selected ? "" : ' tabindex="-1"'}>${label}</button>`;
}

function learnBody() {
	return `<div class="learn" data-tabs data-tabs-vertical>
	<nav class="learn-tabs" aria-label="Curriculum">
		<span class="learn-ink" aria-hidden="true"></span>
		<h2>Curriculum</h2>
		${learnTab("learn-overview", true, "Overview")}
		${learnTab("learn-basics", false, "Basics")}
		${learnTab("learn-cpp", false, "C++ subset")}
		${learnTab("learn-luau", false, "Luau output")}
		${learnTab("learn-mapping", false, "Mapping")}
		${learnTab("learn-types", false, "Types and safety")}
		${learnTab("learn-org", false, "Organization")}
		${learnTab("learn-arch", false, "One file out")}
		${learnTab("learn-oop", false, "OOP structure")}
		${learnTab("learn-libs", false, "Libraries")}
		${learnTab("learn-cout", false, "print / cout")}
		${learnTab("learn-examples", false, "Examples")}
		${learnTab("learn-practice", false, "Best practices")}
	</nav>
	<div>
		${learnPanel(
			"learn-overview",
			true,
			"What Cluaupp is",
			`<p class="muted">Cluaupp is not a full C++ compiler. It is a subset aimed at Roblox scripts, in the same spirit as roblox-ts: a familiar syntax, a restricted language, readable output.</p>
<p>You write <code>.cpp</code> / <code>.h</code>. Tree-sitter walks the CST and Cluaupp emits modern Luau: <code>local</code>, <code>const</code>, and <code>--!strict</code> only with <code>#pragma strict</code> (or <code>"strict": true</code>). Editor completion is <strong>clangd</strong> reading <code>include/cluaupp/roblox.hpp</code>. There is no WASM, no Emscripten, no <code>lua_call</code>.</p>
<p>Start on <strong>Basics</strong> for <code>int</code>, <code>string</code>, <code>const</code>, <code>*</code> (the original Instance), and why <code>&amp;</code> is not how you mutate numbers here.</p>
<p>If <code>void init()</code> exists, the compiler calls it at the end of the script. That is how Scripts and LocalScripts boot.</p>
${codePair(
	`#pragma strict
#include <cluaupp/roblox.hpp>

void init() {
	print("Cluaupp client ok");
}`,
	`--!strict
-- Compiled by Cluaupp — C++ × Luau
const function init()
	print("Cluaupp client ok")
end

init()`,
)}`,
		)}
		${learnPanel(
			"learn-basics",
			false,
			"C++ you actually need",
			`<p class="muted">Cluaupp is a small C++ subset for Roblox scripts. The API pages list every class. This page teaches the language: types, <code>const</code>, <code>*</code>, and how you change the original value.</p>
<h2>Cheat sheet</h2>
<table>
<tr><th>Write</th><th>Means</th><th>Luau</th></tr>
<tr><td><code>int coins = 0;</code></td><td>Whole number. Mutable.</td><td><code>local coins: number = 0</code></td></tr>
<tr><td><code>float t = 0.5;</code> / <code>double g = 196.2;</code></td><td>Same as <code>int</code> at runtime — Luau only has <code>number</code>.</td><td><code>local t: number = 0.5</code></td></tr>
<tr><td><code>bool ready = true;</code></td><td>Yes or no.</td><td><code>local ready: boolean = true</code></td></tr>
<tr><td><code>string name = "Kartz";</code></td><td>Text in quotes. Not <code>std::string</code>.</td><td><code>local name: string = "Kartz"</code></td></tr>
<tr><td><code>const int MAX = 20;</code></td><td>Cannot reassign this variable.</td><td><code>const MAX: number = 20</code></td></tr>
<tr><td><code>void init()</code></td><td>Function with no return. Auto-called at file end.</td><td><code>local function init()</code> then <code>init()</code></td></tr>
<tr><td><code>auto* part = new Part(workspace);</code></td><td>Create an Instance and parent it. <code>*</code> = handle to the original.</td><td><code>Instance.new("Part")</code> + <code>.Parent</code></td></tr>
<tr><td><code>Part* part</code></td><td>Parameter is the original Part, not a copy of its numbers.</td><td><code>part: Part</code></td></tr>
<tr><td><code>part-&gt;Anchored = true;</code></td><td>Write a property on that Instance.</td><td><code>part.Anchored = true</code></td></tr>
<tr><td><code>player-&gt;FindFirstChild("x")</code></td><td>Call an engine method.</td><td><code>player:FindFirstChild("x")</code></td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td>Service from <code>game</code>.</td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td>Datatype value (copied).</td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>CFrame::lookAt(a, b)</code></td><td>Static on a datatype.</td><td><code>CFrame.lookAt(a, b)</code></td></tr>
<tr><td><code>nullptr</code></td><td>Missing Instance.</td><td><code>nil</code></td></tr>
<tr><td><code>true</code> / <code>false</code></td><td>Booleans.</td><td>same</td></tr>
<tr><td><code>== != &amp;&amp; || ! + - * /</code></td><td>Compare and arithmetic. <code>*</code> here is multiply.</td><td><code>~=</code> <code>and</code> <code>or</code></td></tr>
</table>
<h2>int, float, double</h2>
<p>In C++ these are different sizes. In Cluaupp they all become Luau <code>number</code>. Use <code>int</code> for counts and IDs, <code>double</code> / <code>float</code> for world units and alpha. Always initialize: <code>int coins = 0;</code> not <code>int coins;</code>.</p>
${codePair(
	`int coins = 10;
float alpha = 0.25;
double gravity = 196.2;

int Double(int n) {
	return n * 2;
}`,
	`local coins: number = 10
local alpha: number = 0.25
local gravity: number = 196.2

local function Double(n: number): number
	return n * 2
end`,
)}
<h2>string</h2>
<p>Text is <code>string</code> (the headers alias it to <code>const char*</code>). Keep names and remote keys in <code>const string</code>.</p>
${codePair(
	`string name = "Kartz";
const string REMOTE_COINS = "Coins";`,
	`local name: string = "Kartz"
const REMOTE_COINS: string = "Coins"`,
)}
<h2>bool and const</h2>
<p><code>const</code> means this variable cannot be rebound. Player-owned numbers stay mutable. Remote names, product IDs, and starting values should be <code>const</code>.</p>
<p class="note"><code>const Folder* stats</code> still has a mutable <code>Name</code> in Roblox. <code>const</code> protects the variable, not the Instance behind it.</p>
${codePair(
	`const int STARTING_COINS = 0;
const string SHOP_REMOTE = "Buy";
bool loaded = false;
int coins = STARTING_COINS;`,
	`const STARTING_COINS: number = 0
const SHOP_REMOTE: string = "Buy"
local loaded: boolean = false
local coins: number = STARTING_COINS`,
)}
<h2>* means the original Instance</h2>
<p>In Cluaupp, <code>Player*</code> is not a heap address and not pointer arithmetic. It is a handle to a Roblox Instance. There is no <code>delete</code>. You never write <code>*part</code> (dereference) or <code>&amp;part</code> (address-of).</p>
<p>Passing <code>Part*</code> into a function passes that same Instance. <code>part-&gt;Anchored = true</code> changes the Part in the DataModel — the original, not a copy of its Size numbers.</p>
${codePair(
	`void Paint(Part* part) {
	part->BrickColor = BrickColor("Bright red");
	part->Anchored = true;
}

void init() {
	auto* part = new Part(workspace);
	part->Name = "Platform";
	Paint(part);
}`,
	`--!strict
local function Paint(part: Part)
	part.BrickColor = BrickColor.new("Bright red")
	part.Anchored = true
end

local function init()
	local part: Part = Instance.new("Part")
	part.Parent = workspace
	part.Name = "Platform"
	Paint(part)
end

init()`,
)}
<h2>&amp; is C++ — not this subset</h2>
<p>In full C++, <code>int&amp; n</code> is a reference: writing <code>n</code> writes the caller’s int. <code>int n</code> is a copy, so the caller stays unchanged.</p>
<p>Luau numbers copy. Cluaupp does <strong>not</strong> emit C++ references. To change the original value:</p>
<ol>
<li><strong>Instances</strong> — use <code>*</code> and <code>-&gt;</code>. Properties mutate the object.</li>
<li><strong>Numbers</strong> — <code>return</code> the new value, or store it on an <code>IntValue*</code> / <code>NumberValue*</code>.</li>
</ol>
${codePair(
	`void AddCopy(int coins) {
	coins = coins + 1;
}

int Add(int coins) {
	return coins + 1;
}

void AddValue(IntValue* coins) {
	coins->Value = coins->Value + 1;
}

void init() {
	int n = 10;
	AddCopy(n);
	n = Add(n);
	auto* coins = new IntValue(workspace);
	coins->Name = "Coins";
	AddValue(coins);
}`,
	`--!strict
local function AddCopy(coins: number)
	coins = coins + 1
end

local function Add(coins: number): number
	return coins + 1
end

local function AddValue(coins: IntValue)
	coins.Value = coins.Value + 1
end

local function init()
	local n: number = 10
	AddCopy(n)
	n = Add(n)
	local coins: IntValue = Instance.new("IntValue")
	coins.Parent = workspace
	coins.Name = "Coins"
	AddValue(coins)
end

init()`,
)}
<p class="note"><code>AddCopy</code> does not change the caller’s <code>n</code> (still 10 after the call). <code>Add</code> returns 11 and you assign it. <code>AddValue</code> writes <code>Value</code> on the original IntValue — that is the Cluaupp way to “pass by reference”.</p>
<h2>-&gt; . ::</h2>
<table>
<tr><th>C++</th><th>When</th><th>Luau</th></tr>
<tr><td><code>part-&gt;Size</code></td><td>Instance property</td><td><code>part.Size</code></td></tr>
<tr><td><code>part-&gt;FindFirstChild("x")</code></td><td>Instance / library method</td><td><code>part:FindFirstChild("x")</code></td></tr>
<tr><td><code>players-&gt;PlayerAdded.Connect(fn)</code></td><td>Signal</td><td><code>players.PlayerAdded:Connect(fn)</code></td></tr>
<tr><td><code>CFrame::lookAt(a, b)</code></td><td>Datatype or enum static</td><td><code>CFrame.lookAt(a, b)</code></td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td>Enum item</td><td><code>Enum.Material.Plastic</code></td></tr>
</table>
<h2>new, parent, services</h2>
<p>The first argument of <code>new Class(parent)</code> becomes <code>.Parent</code>. Datatypes use <code>Vector3(...)</code>, not <code>new</code>.</p>
${codePair(
	`#include <cluaupp/roblox.hpp>

void init() {
	auto* part = new Part(workspace);
	part->Name = "Platform";
	part->Size = Vector3(8, 1, 8);
	part->Position = Vector3(0, 10, 0);
	part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
	part->Anchored = true;
	part->BrickColor = BrickColor("Bright red");
	part->Color = Color3::fromRGB(255, 0, 0);

	auto* players = GetService<Players>();
	auto* gui = new ScreenGui(players->LocalPlayer->FindFirstChild("PlayerGui"));
	auto* frame = new Frame(gui);
	frame->Size = UDim2::fromScale(1, 1);
	frame->Position = UDim2(0, 0, 0, 0);
}`,
	`--!strict
local function init()
	local part: Part = Instance.new("Part")
	part.Parent = workspace
	part.Name = "Platform"
	part.Size = Vector3.new(8, 1, 8)
	part.Position = Vector3.new(0, 10, 0)
	part.CFrame = CFrame.lookAt(Vector3.new(0, 10, 0), Vector3.new(0, 10, -10))
	part.Anchored = true
	part.BrickColor = BrickColor.new("Bright red")
	part.Color = Color3.fromRGB(255, 0, 0)

	local players: Players = game:GetService("Players")
	local gui: ScreenGui = Instance.new("ScreenGui")
	gui.Parent = players.LocalPlayer:FindFirstChild("PlayerGui")
	local frame: Frame = Instance.new("Frame")
	frame.Parent = gui
	frame.Size = UDim2.fromScale(1, 1)
	frame.Position = UDim2.new(0, 0, 0, 0)
end

init()`,
)}
<h2>Everything in the subset</h2>
<table>
<tr><th>Area</th><th>You can use</th></tr>
<tr><td>Files</td><td><code>.cpp</code> <code>.h</code> <code>.hpp</code> · tags <code>.server</code> <code>.client</code> · <code>#include "file.h"</code> inlined · <code>#include &lt;cluaupp/...&gt;</code> for IntelliSense / libs</td></tr>
<tr><td>Types</td><td><code>int</code> <code>float</code> <code>double</code> <code>bool</code> <code>string</code> <code>void</code> <code>auto</code> <code>auto*</code> · any Roblox class with <code>*</code> · datatypes by name</td></tr>
<tr><td>Values</td><td><code>const</code> · <code>nullptr</code> · <code>true</code> <code>false</code> · quoted strings · numbers</td></tr>
<tr><td>Engine</td><td><code>new Class(parent)</code> · <code>GetService&lt;T&gt;()</code> · <code>-&gt;</code> properties and methods · <code>::</code> statics · <code>.Connect</code></td></tr>
<tr><td>Control</td><td><code>if</code> / <code>else</code> · <code>while</code> · range-<code>for (auto* x : list)</code> · <code>return</code></td></tr>
<tr><td>Ops</td><td><code>== != &lt; &gt; &lt;= &gt;= &amp;&amp; || ! + - * /</code></td></tr>
<tr><td>Boot</td><td><code>void init()</code> is called at the end of Scripts / LocalScripts</td></tr>
<tr><td>Libs</td><td>Janitor, Promise, Net, Fusion, Cmdr, DataService, Twinkle, FormatNumber via headers</td></tr>
</table>
<h2>Not in the subset</h2>
<p>C++ <code>&amp;</code> references, <code>*p</code> dereference, pointer arithmetic, <code>delete</code>, <code>switch</code>, C-style <code>for (int i = 0; ...)</code>, custom <code>class</code> bodies, <code>std::</code>, templates besides <code>GetService&lt;T&gt;</code>, macros, overloading.</p>
<p>Next: the C++ subset tab, or the <a href="../docs/engine.html">engine spelling</a> for services, datatypes, and enums. Instance members: <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a>.</p>`,
		)}
		${learnPanel(
			"learn-cpp",
			false,
			"The C++ subset",
			`<p class="muted">Extensions: <code>.cpp</code>, <code>.h</code>, <code>.hpp</code> (also <code>.cc</code>, <code>.hh</code>). Quoted <code>#include "file.h"</code> is inlined. <code>#include &lt;cluaupp/...&gt;</code> is IntelliSense only — library headers also inject <code>require</code>.</p>
<p>Read <strong>Basics</strong> first for <code>int</code>, <code>string</code>, <code>const</code>, and <code>*</code>. This tab is functions, locals, and control flow.</p>
<p>Function prototypes are skipped. Only functions with a body are emitted. <code>#pragma once</code> is ignored. <code>#pragma strict</code> / <code>#pragma nstrict</code> control <code>--!strict</code> for that compilation unit.</p>
${codePair(
	`void CreateLeaderstats(Player* player) {
	return;
}

int doubleCoins(int coins) {
	return coins;
}`,
	`local function CreateLeaderstats(player: Player)
	return
end

local function doubleCoins(coins: number): number
	return coins
end`,
)}
<p><code>void</code> omits a return annotation. <code>int</code> / <code>float</code> / <code>double</code> become <code>number</code>. <code>bool</code> becomes <code>boolean</code>. Roblox types keep their name.</p>
<h2>Locals, const, auto</h2>
${codePair(
	`int coins = 10;
const int STARTING_COINS = 0;
auto* folder = new Folder(player);`,
	`local coins: number = 10
const STARTING_COINS: number = 0
local folder: Folder = Instance.new("Folder")
folder.Parent = player`,
)}
<p><code>auto</code> infers the type when the value is <code>new Class(...)</code> or <code>GetService&lt;T&gt;()</code>.</p>
<h2>Control flow</h2>
<p>The only <code>for</code> accepted today is range-for: <code>for (auto* x : list)</code>. C-style <code>for (int i = 0; i &lt; n; i++)</code> is not supported yet. <code>switch</code> becomes <code>if</code> / <code>elseif</code> / <code>else</code> inside <code>repeat … until true</code> so <code>break</code> still exits the switch. Stacked <code>case</code> labels share a body; there is no fall-through into the next case’s statements.</p>
${codePair(
	`if (player->FindFirstChild("leaderstats") != nullptr) {
	return;
} else {
	print("ok");
}

for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}

switch (action) {
case "buy":
case "purchase":
	Grant(player);
	break;
case "sell":
	if (amount <= 0) {
		break;
	}
	Take(player);
	break;
default:
	warn("unknown");
	break;
}`,
	`if player:FindFirstChild("leaderstats") ~= nil then
	return
else
	print("ok")
end

for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end

repeat
	if action == "buy" or action == "purchase" then
		Grant(player)
	elseif action == "sell" then
		if amount <= 0 then
			break
		end
		Take(player)
	else
		warn("unknown")
	end
until true`,
)}
<h2>new and services</h2>
<p>The first argument of <code>new Class(parent)</code> becomes <code>.Parent</code>.</p>
${codePair(
	`auto* coins = new IntValue(leaderstats);
auto* players = GetService<Players>();`,
	`local coins: IntValue = Instance.new("IntValue")
coins.Parent = leaderstats
local players: Players = game:GetService("Players")`,
)}
<p>Not in the subset: custom C++ classes, generic templates besides <code>GetService&lt;T&gt;</code>, pointer arithmetic, <code>std::</code>, overloading, macros.</p>`,
		)}
		${learnPanel(
			"learn-luau",
			false,
			"The Luau that comes out",
			`<p class="muted">Generated Luau follows the current language. Variables are <code>local</code>. Constants are Luau <code>const</code>, not <code>local x &lt;const&gt;</code>. <code>--!strict</code> is emitted only with <code>#pragma strict</code> or <code>"strict": true</code> in config.</p>
<p><code>-&gt;</code> becomes <code>.</code> for properties and <code>:</code> for engine and library methods. <code>signal.Connect</code> becomes <code>signal:Connect</code>.</p>
${codePair(
	`player->Name = "Kartz";
player->FindFirstChild("leaderstats");
players->PlayerAdded.Connect(CreateLeaderstats);`,
	`player.Name = "Kartz"
player:FindFirstChild("leaderstats")
players.PlayerAdded:Connect(CreateLeaderstats)`,
)}
<p>If you define <code>void init()</code>, Cluaupp appends a call to <code>init()</code>. Use that in Scripts and LocalScripts. ModuleScripts (untagged <code>.cpp</code>) return a table and do not auto-run.</p>`,
		)}
		${learnPanel(
			"learn-mapping",
			false,
			"C++ ↔ Luau mapping",
			`<p class="muted">Keep this table nearby. It is the whole surface of the transpiler for datatypes, instances, and operators.</p>
${mappingTable()}
<p>Official engine reference: <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a>. Cluaupp class pages link the same names.</p>`,
		)}
		${learnPanel(
			"learn-types",
			false,
			"Types and safety",
			`<p class="muted">A type is a contract: what a value is allowed to be, and what you are allowed to do with it. The Basics tab is the language lesson. This tab is why types catch live-game bugs.</p>
<p><code>Player*</code> is not a heap address — it is a Roblox Instance of class Player. There is no <code>delete</code> and no pointer arithmetic. Lifetime is Roblox’s: parented Instances live until Destroy, or until a Janitor cleans them.</p>
<table>
<tr><th>C++</th><th>Luau</th><th>Use for</th></tr>
<tr><td><code>int</code>, <code>float</code>, <code>double</code></td><td><code>number</code></td><td>counts, damage, alpha. All the same at runtime.</td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td><td>flags</td></tr>
<tr><td><code>string</code></td><td><code>string</code></td><td>names, remote keys, paths</td></tr>
<tr><td><code>void</code></td><td>(no return)</td><td>procedures</td></tr>
<tr><td><code>auto</code> / <code>auto*</code></td><td>inferred</td><td><code>new</code> / <code>GetService</code></td></tr>
<tr><td><code>Player*</code>, <code>Folder*</code></td><td><code>Player</code>, <code>Folder</code></td><td>the original Instance (mutate with <code>-&gt;</code>)</td></tr>
<tr><td><code>Vector3</code>, <code>CFrame</code>, <code>UDim2</code></td><td>same names</td><td>copied values — assigning a new Vector3 replaces it</td></tr>
</table>
<h2>Copy vs original</h2>
<p><code>int</code> and <code>Vector3</code> copy. <code>Part*</code> does not: two variables can hold the same Instance, and <code>-&gt;</code> writes the world object. C++ <code>&amp;</code> references are not in the subset. To change a number the caller owns, <code>return</code> it or write <code>IntValue-&gt;Value</code>.</p>
${codePair(
	`int n = 10;
void BumpCopy(int x) { x = x + 1; }

void BumpStat(IntValue* coins) {
	coins->Value = coins->Value + 1;
}`,
	`local n: number = 10
local function BumpCopy(x: number)
	x = x + 1
end

local function BumpStat(coins: IntValue)
	coins.Value = coins.Value + 1
end`,
)}
<p><code>nullptr</code> is <code>nil</code>. Always test <code>FindFirstChild</code> before using the result.</p>
${codePair(
	`auto* stats = player->FindFirstChild("leaderstats");
if (stats == nullptr) {
	return;
}`,
	`local stats = player:FindFirstChild("leaderstats")
if stats == nil then
	return
end`,
)}
<h2>Never trust the client</h2>
<p>Net lets a client FireServer. The server validates intent (<code>productId</code>), not a new coin total the client invented. Only the server writes persisted DataService paths. Use <code>SetTransient</code> for test overlays.</p>
<h2>const is a safety feature</h2>
<p>Remote names, starting values, and product IDs should be <code>const</code>. Player-owned numbers stay mutable.</p>
${codePair(
	`const string REMOTE_COINS = "Coins";
int coins = 0;

void AddCoins(int amount) {
	coins = coins + amount;
}`,
	`const REMOTE_COINS: string = "Coins"
local coins: number = 0

local function AddCoins(amount: number)
	coins = coins + amount
end`,
)}
<h2>Janitor owns connections</h2>
<p>Every Connect that outlives a player, a GUI, or a tool needs a Janitor. Leaked connections duplicate effects: double coins, stacked cameras, lingering highlights.</p>
${codePair(
	`auto* janitor = new Janitor();
janitor->LinkToInstance(player);
janitor->Add(players->PlayerAdded.Connect(OnPlayer));`,
	`local janitor = Janitor.new()
janitor:LinkToInstance(player)
janitor:Add(players.PlayerAdded:Connect(OnPlayer))`,
)}`,
		)}
		${learnPanel(
			"learn-org",
			false,
			"Server, client, shared",
			`<p class="muted">A Cluaupp game is laid out like a roblox-ts project on disk. One tagged <code>.cpp</code> becomes one Script / LocalScript / ModuleScript. Rojo places those files under Studio services.</p>
${studioStage()}
<p class="note">Icons match Studio Explorer: yellow folder, blue Script / LocalScript, brown ModuleScript. Expand a row the way you would in Roblox Studio.</p>
<table>
<tr><th>Folder</th><th>Runs on</th><th>Allowed to</th></tr>
<tr><td><code>src/server</code></td><td>Server</td><td>DataStore, DataService writes, <code>Net:Fire</code></td></tr>
<tr><td><code>src/client</code></td><td>Client</td><td>UI, camera, <code>Net:FireServer</code></td></tr>
<tr><td><code>src/shared</code></td><td>Both</td><td>types, <code>const</code> config, FormatNumber</td></tr>
</table>
<p>If a file needs DataStoreService, it is server. If it needs UserInputService, it is client. Shared code must compile in both.</p>
<p>Filename tags: <code>*.server.cpp</code>, <code>*.client.cpp</code>, <code>*.legacy.server.cpp</code>, <code>*.legacy.client.cpp</code>, or no tag (ModuleScript). One system per file: <code>leaderstats.server.cpp</code> does not also open the shop UI. One source file becomes one instance.</p>
<p>In the Cluaupp repo, compiler TypeScript lives in <code>src/</code>. Sample game C++ is <code>examples/game/src/{server,client,shared}</code>. <code>cluaupp init</code> copies <code>templates/game</code>.</p>
<p>C++ autocomplete is clangd. Put <code>#include &lt;cluaupp/roblox.hpp&gt;</code> at the top of each script. <code>cluaupp intellisense</code> writes <code>compile_commands.json</code> / <code>.clangd</code>.</p>`,
		)}
		${learnPanel(
			"learn-arch",
			false,
			"One file in, one file out",
			`<p class="muted">The filename tag decides Script / LocalScript / ModuleScript — the same keys as roblox-ts. Cluaupp stops there by default. It does not invent Main / Controller / Types folders.</p>
<p><strong>SystemUnderstander</strong> then scans Tree-sitter identifiers (no generative AI). Token density scores intents (combat, ui, net, data, players). Score under 2 → utility Module. Otherwise it stamps a Knit-style role (<code>CombatController</code>, <code>ViewController</code>) and may inject <code>GetService</code>. The Rojo class never changes because of that role.</p>
<p><code>DataBoot.client.cpp</code> becomes <code>out/client/boot/DataBoot.client.luau</code>. Shared <code>#include</code> modules use <code>require(ReplicatedStorage.Cluaupp...)</code>.</p>
${codePair(
	`#pragma strict
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>

void init() {
	DataService::Client.Init();
}`,
	`--!strict
-- Compiled by Cluaupp — C++ × Luau

const ReplicatedStorage = game:GetService("ReplicatedStorage")
const DataService = require(ReplicatedStorage.CluauppLibs.DataService)
type DataService = DataService.DataService

const function init()
	DataService.Client:Init()
end

init()`,
)}
<p>Rojo maps <code>out/server</code> to <code>ServerScriptService.Cluaupp</code>, <code>out/client</code> to <code>StarterPlayerScripts.Cluaupp</code>, <code>out/shared</code> to <code>ReplicatedStorage.Cluaupp</code>.</p>
<p>Set <code>"architecture": true</code> only if you want the old ForeverHD planner: PascalCase folders, <code>Main.Start</code> / <code>Stop</code>, Managers, Controllers, Types.</p>
${serviceExplorers()}
${preCode(`filename key     →  Script | LocalScript | ModuleScript
SystemUnderstander →  role + GetService inject (comments)
opt-in architecture: true → Main / Managers / Controllers / Types`, "plain")}
<p>The OOP tab is how you <em>write</em> a system with typed structs. The Examples tab is copy-paste systems.</p>
<p><code>--!strict</code> is opt-in: <code>#pragma strict</code> in the <code>.cpp</code>, or <code>"strict": true</code> in config. <code>#pragma nstrict</code> never emits it.</p>`,
		)}
		${learnPanel("learn-oop", false, "OOP structure", guides().oopInner())}
		${learnPanel("learn-libs", false, "CluauppLibs", guides().librariesInner())}
		${learnPanel("learn-cout", false, "print and cout", guides().printCoutInner())}
		${learnPanel("learn-examples", false, "Examples", guides().examplesInner())}
		${learnPanel(
			"learn-practice",
			false,
			"Best practices",
			`<ul>
<li>One system per file. Name it after the job: <code>inventory.server.cpp</code>, <code>shop.client.cpp</code>.</li>
<li>Typed data lives in shared <code>struct</code> headers. Methods are named functions. Lifetime is <code>init</code> + Janitor.</li>
<li>Keep config in <code>src/shared/config.h</code> as <code>const</code> values.</li>
<li>Do not edit <code>out/</code>. It is generated. Source of truth is the game <code>src/</code>.</li>
<li>C++ IntelliSense is clangd + <code>roblox.hpp</code>. Do not install a second C++ completion engine.</li>
<li>Never trust FireServer payloads. Validate on the server. Persist only from the server.</li>
<li>Janitor every connection that can outlive the object that created it.</li>
<li>Prefer <code>FindFirstChild</code> plus an early return over <code>WaitForChild</code> on hot paths.</li>
<li>Remote names are public protocol. Keep them <code>const</code>, short, and unique.</li>
<li>Net packs buffers — do not JSONEncode a whole inventory every heartbeat. Send deltas.</li>
<li>Do not install a second Janitor from Wally. CluauppLibs already has it.</li>
<li>Shared modules must be safe on both server and client.</li>
<li>Default <code>.server.cpp</code> emits <code>*.server.luau</code> (one file in, one file out). PascalCase folders are opt-in.</li>
</ul>
<p>Next: <a href="../docs/structs.html">structs and methods</a>, <a href="../docs/leaderstats.html">leaderstats</a>, or <a href="../docs/engine.html">engine spelling</a>.</p>`,
		)}
	</div>
</div>`;
}

module.exports = {
	escapeHtml,
	codePair,
	mappingTable,
	localLayout,
	homeBody,
	introBody,
	movedBody,
	learnBody,
	guideArticle,
	createDocsPages: () => createDocsPages({ codePair, preCode, escapeHtml, mappingTable }),
	docsNav,
	withHeadingIds,
	pageToc,
	oopGuide: () => guideArticle("OOP structure", guides().oopInner()),
	examplesGuide: () => guideArticle("Examples", guides().examplesInner()),
	librariesGuide: () => guideArticle("Libraries", guides().librariesInner()),
	printCoutGuide: () => guideArticle("print and cout", guides().printCoutInner()),
	preCode,
};
