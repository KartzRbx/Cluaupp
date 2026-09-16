"use strict";

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
	<div class="pair-panel" role="tabpanel" id="${id}-cpp" aria-labelledby="${id}-tab-cpp"><pre>${escapeHtml(cpp)}</pre></div>
	<div class="pair-panel" role="tabpanel" id="${id}-luau" aria-labelledby="${id}-tab-luau" hidden><pre>${escapeHtml(luau)}</pre></div>
</div>`;
}

function mappingTable() {
	return `<table>
<tr><th>C++</th><th>Luau</th></tr>
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

function navItem(href, label, page, id) {
	const current = page === id ? ' aria-current="page"' : "";
	return `<a href="${href}"${current}>${label}</a>`;
}

function localLayout(title, body, sidebar, depth, page = "") {
	const prefix = depth === 0 ? "./" : "../".repeat(depth);
	const inner = sidebar
		? `<main class="docs"><aside>${sidebar}</aside><article class="docs-article">${body}</article></main>`
		: body;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Cluaupp</title>
<link rel="icon" href="${prefix}assets/logo.png">
<link rel="stylesheet" href="${prefix}assets/style.css">
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
      ${navItem(`${prefix}learn/index.html`, "Learn", page, "learn")}
      ${navItem(`${prefix}guide/getting-started.html`, "Start", page, "start")}
      ${navItem(`${prefix}api/datatypes/index.html`, "Datatypes", page, "datatypes")}
      ${navItem(`${prefix}api/classes/index.html`, "Classes", page, "classes")}
      ${navItem(`${prefix}api/enums/index.html`, "Enums", page, "enums")}
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
  <span><a href="https://github.com/KartzRbx/Cluaupp">GitHub</a> · <a href="https://create.roblox.com/docs/reference/engine">Roblox API</a></span>
</footer>
<script src="${prefix}assets/app.js"></script>
<button class="ask-toggle" type="button" data-ask-toggle>Ask Cluaupp</button>
<div class="ask-panel" data-ask-panel hidden>
  <div class="ask-log" data-ask-log><p class="muted">Ask about the C++ subset, Luau output, or Roblox APIs. Powered by Vercel AI Gateway.</p></div>
  <form class="ask-form" data-ask-form>
    <input name="q" type="text" autocomplete="off" placeholder="How does init() work?">
    <button type="submit">Send</button>
  </form>
</div>
</body>
</html>
`;
}

function homeBody({ dump, classCount, enumCount }) {
	const version = escapeHtml(String(dump.Version || ""));
	return `
<section class="hero">
  <div class="hero-copy reveal">
    <p class="eyebrow">C++ × Luau</p>
    <h1>Write C++.<br>Ship Studio Luau.</h1>
    <p class="lede">Cluaupp is the definitive merge of a C++ subset and modern Luau. No WASM. No lua_call. Roblox APIs leave the compiler the same way they look in Studio.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="learn/index.html">Learn the language</a>
      <a class="btn btn-ghost" href="api/classes/index.html">Open the API</a>
    </div>
    <pre>npm install -g cluaupp
cluaupp init my-game
cluaupp build
rojo serve</pre>
  </div>
  <img class="hero-logo" src="./assets/logo.png" alt="Cluaupp mark">
</section>
<section class="section" data-reveal>
  <h2>Engine, not a dump</h2>
  <p class="muted">Docs generated from the official Roblox API dump${version ? ` (${version})` : ""} — the same classes, properties, methods, and enums as <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a>.</p>
  <div class="grid">
    <a class="card" href="learn/index.html"><strong>Learn</strong><span class="muted">C++ subset, Luau output, architecture, safety</span></a>
    <a class="card" href="guide/getting-started.html"><strong>Get started</strong><span class="muted">install, init, Rojo, IntelliSense</span></a>
    <a class="card" href="api/datatypes/index.html"><strong>Datatypes</strong><span class="muted">Vector3, CFrame, UDim2, Color3</span></a>
    <a class="card" href="api/classes/index.html"><strong>Classes</strong><span class="muted">${classCount} instances and services</span></a>
    <a class="card" href="api/enums/index.html"><strong>Enums</strong><span class="muted">${enumCount} enumerations</span></a>
  </div>
</section>
<section class="section" data-reveal>
  <h2>C++ becomes Luau</h2>
  <p class="muted">Hover the cards. Flip the tabs. The mapping is the product.</p>
  ${codePair(
		`auto* players = GetService<Players>();
for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}
players->PlayerAdded.Connect(CreateLeaderstats);`,
		`--!strict
local players: Players = game:GetService("Players")
for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end
players.PlayerAdded:Connect(CreateLeaderstats)`,
	)}
  ${mappingTable()}
</section>
<section class="section" data-reveal>
  <h2>Libraries that compile with you</h2>
  <p class="muted">Janitor, Promise, Fusion, Cmdr, DataService, Net, Twinkle and the rest ship in CluauppLibs. Include a header; the compiler injects <code>require</code>.</p>
</section>
`;
}

function learnPanel(id, selected, title, inner) {
	return `<section class="learn-panel" role="tabpanel" id="${id}" aria-labelledby="${id}-tab"${selected ? "" : " hidden"}>
	<h1>${title}</h1>
	${inner}
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
		${learnTab("learn-cpp", false, "C++ subset")}
		${learnTab("learn-luau", false, "Luau output")}
		${learnTab("learn-mapping", false, "Mapping")}
		${learnTab("learn-types", false, "Types and safety")}
		${learnTab("learn-org", false, "Organization")}
		${learnTab("learn-arch", false, "Architecture")}
		${learnTab("learn-libs", false, "Libraries")}
		${learnTab("learn-practice", false, "Best practices")}
	</nav>
	<div>
		${learnPanel(
			"learn-overview",
			true,
			"What Cluaupp is",
			`<p class="muted">Cluaupp is not a full C++ compiler. It is a subset aimed at Roblox scripts, in the same spirit as roblox-ts: a familiar syntax, a restricted language, readable output.</p>
<p>You write <code>.cpp</code> / <code>.h</code>. Cluaupp emits modern Luau: <code>--!strict</code>, <code>local</code>, and <code>const</code>. There is no WASM, no Emscripten, no <code>lua_call</code>.</p>
<p>If <code>void init()</code> exists, the compiler calls it at the end of the script. That is how Scripts and LocalScripts boot.</p>
${codePair(
	`#include <cluaupp/roblox.hpp>

void init() {
	print("Cluaupp client ok");
}`,
	`--!strict
local function init()
	print("Cluaupp client ok")
end

init()`,
)}`,
		)}
		${learnPanel(
			"learn-cpp",
			false,
			"The C++ subset",
			`<p class="muted">Extensions: <code>.cpp</code>, <code>.h</code>, <code>.hpp</code> (also <code>.cc</code>, <code>.hh</code>). Quoted <code>#include "file.h"</code> is inlined. <code>#include &lt;cluaupp/...&gt;</code> is IntelliSense only — library headers also inject <code>require</code>.</p>
<p>Function prototypes are skipped. Only functions with a body are emitted. <code>#pragma once</code> and other <code>#</code> lines are ignored.</p>
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
<p>The only <code>for</code> accepted today is range-for: <code>for (auto* x : list)</code>. C-style <code>for (int i = 0; i &lt; n; i++)</code> is not supported yet. <code>switch</code> is not supported.</p>
${codePair(
	`if (player->FindFirstChild("leaderstats") != nullptr) {
	return;
} else {
	print("ok");
}

for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}`,
	`if player:FindFirstChild("leaderstats") ~= nil then
	return
else
	print("ok")
end

for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end`,
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
			`<p class="muted">Generated Luau follows the current language. Every module starts with <code>--!strict</code>. Variables are <code>local</code>. Constants are Luau <code>const</code>, not <code>local x &lt;const&gt;</code>.</p>
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
			`<p class="muted">A type is a contract: what a value is allowed to be, and what you are allowed to do with it. <code>Player*</code> is not a heap address — it is a Roblox Instance of class Player. There is no <code>delete</code> and no pointer arithmetic. Lifetime is Roblox’s: parented Instances live until Destroy, or until a Janitor cleans them.</p>
<table>
<tr><th>C++</th><th>Luau</th><th>Use for</th></tr>
<tr><td><code>int</code>, <code>float</code>, <code>double</code></td><td><code>number</code></td><td>counts, damage, alpha</td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td><td>flags</td></tr>
<tr><td><code>string</code></td><td><code>string</code></td><td>names, paths</td></tr>
<tr><td><code>void</code></td><td>(no return)</td><td>procedures</td></tr>
<tr><td><code>auto</code></td><td>inferred</td><td><code>new</code> / <code>GetService</code></td></tr>
<tr><td><code>Player*</code>, <code>Folder*</code></td><td><code>Player</code>, <code>Folder</code></td><td>Instances</td></tr>
</table>
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
			`<p class="muted">A Cluaupp game is laid out like a roblox-ts project on disk. The output is not a 1:1 dump: <code>cluaupp build</code> turns each system into a PascalCase service folder.</p>
<pre>src/
  server/     → Script (out/server)
  client/     → LocalScript (out/client)
  shared/     → ModuleScript (out/shared)</pre>
<table>
<tr><th>Folder</th><th>Runs on</th><th>Allowed to</th></tr>
<tr><td><code>src/server</code></td><td>Server</td><td>DataStore, DataService writes, <code>Net:Fire</code></td></tr>
<tr><td><code>src/client</code></td><td>Client</td><td>UI, camera, <code>Net:FireServer</code></td></tr>
<tr><td><code>src/shared</code></td><td>Both</td><td>types, <code>const</code> config, FormatNumber</td></tr>
</table>
<p>If a file needs DataStoreService, it is server. If it needs UserInputService, it is client. Shared code must compile in both.</p>
<p>Filename tags: <code>*.server.cpp</code>, <code>*.client.cpp</code>, <code>*.legacy.server.cpp</code>, <code>*.legacy.client.cpp</code>, or no tag (ModuleScript). One system per file: <code>leaderstats.server.cpp</code> does not also open the shop UI.</p>`,
		)}
		${learnPanel(
			"learn-arch",
			false,
			"Service architecture",
			`<p class="muted">The planner reads two keys. The filename tag decides Script / LocalScript / ModuleScript. AST intents decide the roles: Main, Managers, Controllers, Types.</p>
<pre>filename key  →  server | client | module | legacy
AST features  →  GetService, Instance.new, methods, identifiers
intent scores →  combat:2, character:1, …
roles         →  Main + Managers + Controllers + Types</pre>
<p>A tiny <code>leaderstats.server.cpp</code> becomes <code>LeaderStats/</code> with Main, PlayersManager, CacheController, LeaderStatsTypes. A combat file with TakeDamage becomes CombatController — not a fake CacheController.</p>
<p>Trivial files that only <code>print</code> stay a single LocalScript. The planner does not invent Managers for hello-world.</p>
<p>ForeverHD-style rules in the output: PascalCase folders, <code>--!strict</code>, public <code>Start</code> / <code>Stop</code>, Janitor in the Manager, Types modules <code>return {}</code>.</p>
<p>Set <code>"architecture": false</code> in <code>cluaupp.config.json</code> (or use <code>.legacy.*.cpp</code>) for a 1:1 dump.</p>`,
		)}
		${learnPanel(
			"learn-libs",
			false,
			"CluauppLibs",
			`<p class="muted"><code>cluaupp build</code> copies full Luau systems into <code>libs/</code> (Rojo: <code>ReplicatedStorage.CluauppLibs</code>). Include a header; the compiler injects require. Wally is optional — only for extra community packages.</p>
<table>
<tr><th>Library</th><th>Header</th><th>Role</th></tr>
<tr><td>Janitor</td><td><code>&lt;cluaupp/libs/janitor.hpp&gt;</code></td><td>lifetime</td></tr>
<tr><td>Promise</td><td><code>&lt;cluaupp/libs/promise.hpp&gt;</code></td><td>async</td></tr>
<tr><td>Net</td><td><code>&lt;cluaupp/libs/net.hpp&gt;</code></td><td>buffer remotes</td></tr>
<tr><td>Fusion</td><td><code>&lt;cluaupp/libs/fusion.hpp&gt;</code></td><td>UI state</td></tr>
<tr><td>Cmdr</td><td><code>&lt;cluaupp/libs/cmdr.hpp&gt;</code></td><td>commands</td></tr>
<tr><td>DataService</td><td><code>&lt;cluaupp/libs/dataservice.hpp&gt;</code></td><td>profiles</td></tr>
<tr><td>Twinkle</td><td><code>&lt;cluaupp/libs/twinkle.hpp&gt;</code></td><td>UI motion</td></tr>
<tr><td>FormatNumber</td><td><code>&lt;cluaupp/libs/formatnumber.hpp&gt;</code></td><td>abbreviate</td></tr>
</table>
${codePair(
	`#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>

void init() {
	auto* janitor = new Janitor();
	auto* coins = Net::Event("Coins");
	janitor->Add(coins);
}`,
	`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)
local Net = require(ReplicatedStorage.CluauppLibs.Net)

local function init()
	local janitor = Janitor.new()
	local coins = Net.Event("Coins")
	janitor:Add(coins)
end`,
)}`,
		)}
		${learnPanel(
			"learn-practice",
			false,
			"Best practices",
			`<ul>
<li>One system per file. Name it after the job: <code>inventory.server.cpp</code>, <code>shop.client.cpp</code>.</li>
<li>Keep config in <code>src/shared/config.h</code> as <code>const</code> values.</li>
<li>Do not edit <code>out/</code>. It is generated. Source of truth is <code>src/</code>.</li>
<li>Never trust FireServer payloads. Validate on the server. Persist only from the server.</li>
<li>Janitor every connection that can outlive the object that created it.</li>
<li>Prefer <code>FindFirstChild</code> plus an early return over <code>WaitForChild</code> on hot paths.</li>
<li>Remote names are public protocol. Keep them <code>const</code>, short, and unique.</li>
<li>Net packs buffers — do not JSONEncode a whole inventory every heartbeat. Send deltas.</li>
<li>Do not install a second Janitor from Wally. CluauppLibs already has it.</li>
<li>Shared modules must be safe on both server and client.</li>
</ul>
<p>Next: <a href="../guide/getting-started.html">install and Rojo</a>, or open the <a href="../api/classes/index.html">class API</a>.</p>`,
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
	learnBody,
};
