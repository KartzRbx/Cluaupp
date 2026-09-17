import { uiPageInner } from "./ui";
import { registerCppLessons, registerLuauLesson } from "./lessons";
import type { DocsPage, PageHelpers } from "../lib/types";

export function createDocsPages({ codePair, preCode, escapeHtml, mappingTable }: PageHelpers): DocsPage[] {
	void escapeHtml;
	const pages: DocsPage[] = [];
	const page = (id: string, file: string, title: string, group: string, inner: string) => {
		pages.push({ id, file, title, group, inner });
	};

	page(
		"intro",
		"index.html",
		"Introduction",
		"Start",
		`<p class="muted">Cluaupp is the <strong>Roblox toolchain</strong> for <a href="https://kartzrbx.github.io/CLPP/">CL++</a>. You write <code>.clpp</code> / <code>.clp</code> / <code>.clh</code>. Cluaupp runs <code>clpp api compile</code>, rewrites <code>ClppLibs</code> into <code>ReplicatedStorage.CluauppLibs</code>, and writes <code>out/</code> for Rojo. Studio runs Luau — never CL++.</p>
<p>The language course lives on the <a href="https://kartzrbx.github.io/CLPP/">CL++ site</a>. This handbook is the game side: files, CLI, libs, and how emitted Luau looks.</p>
<h2>A first program</h2>
<p>There is no <code>int main()</code>. Scripts boot with <code>void init()</code>.</p>
${codePair(
	`#include <clpp/roblox.clh>

void init() {
	post("Hello World!");
}`,
	`const function init()
	print("Hello World!")
end

init()`,
)}
<p>Save as <code>Hello.server.clpp</code> or <code>Hello.client.clpp</code>. Then <a href="setup.html">Setup</a> if the CLI is not installed yet. First syntax lesson: <a href="syntax.html">1. Syntax</a>.</p>
<h2>How a lesson is built</h2>
<ol>
<li>A short rule (what the statement is).</li>
<li>A CL++ / Luau pair — the right tab is what Studio runs.</li>
<li>Operators that belong to CL++: <code>.:</code> concat, <code>::</code> methods, <code>~&gt;</code> janitor Connect, <code>guard</code>, <code>match</code>, <code>signal</code>.</li>
</ol>
<h2>A real game script</h2>
<p>After the basics, this is the shape of production code: filename tags, Janitor, <code>init()</code>.</p>
${codePair(
	`#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

void CreateLeaderstats(Player* player) {
	guard (player != null) else {
		return;
	}
	if (player::FindFirstChild("leaderstats") != null) {
		return;
	}
	Folder* leaderstats = new Folder(player);
	leaderstats.Name = "leaderstats";
	IntValue* coins = new IntValue(leaderstats);
	coins.Name = "Coins";
	coins.Value = 0;
}

void init() {
	Players* players = GetService<Players>();
	for (Player* player : players::GetPlayers()) {
		CreateLeaderstats(player);
	}
	players::PlayerAdded~>Connect(CreateLeaderstats);
}`,
	`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)

local function CreateLeaderstats(player: Player)
	if not player then
		return
	end
	if player:FindFirstChild("leaderstats") ~= nil then
		return
	end
	local leaderstats = Instance.new("Folder")
	leaderstats.Parent = player
	leaderstats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Parent = leaderstats
	coins.Name = "Coins"
	coins.Value = 0
end

const function init()
	local players: Players = game:GetService("Players")
	for _, player in players:GetPlayers() do
		CreateLeaderstats(player)
	end
	players.PlayerAdded:Connect(CreateLeaderstats)
end

init()`,
)}
<p>Language spec: <a href="https://kartzrbx.github.io/CLPP/">kartzrbx.github.io/CLPP</a>. Engine members: <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a>. Cheat sheet: <a href="reference.html">Language reference</a>. Coming from <code>.cpp</code>: <a href="migration.html">Migration</a>.</p>`,
	);

	page(
		"setup",
		"setup.html",
		"Setup",
		"Start",
		`<p class="muted">Node 18+, Rojo <strong>7.7.0</strong>, and <strong>clpp on PATH</strong> from <a href="https://github.com/KartzRbx/CLPP">KartzRbx/CLPP</a>. Cluaupp does not compile CL++ itself.</p>
<h2>Install CL++</h2>
${preCode(`git clone https://github.com/KartzRbx/CLPP
cd CLPP
cargo install --path .
clpp install`, "plain")}
<p>Override the binary with <code>CLPP_PATH</code> if it is not on PATH.</p>
<h2>Install Cluaupp</h2>
${preCode(`npm install -g cluaupp
cluaupp init my-game
cd my-game
rokit install
cluaupp build
rojo serve`, "plain")}
<p><code>npm install cluaupp</code> only adds the toolchain. Scaffolding is <code>cluaupp init</code> (or <code>npx cluaupp init .</code> in an empty folder).</p>
<p>Without a global install: <code>npx cluaupp init my-game</code>. As a game dependency: <code>npm install --save-dev cluaupp</code> and npm scripts <code>cluaupp build</code> / <code>cluaupp watch</code>.</p>
<h2>What init writes</h2>
${preCode(`my-game/
  cluaupp.config.json
  default.project.json
  rokit.toml
  src/server/   *.server.clpp
  src/client/   *.client.clpp
  src/shared/   .clp / .clh modules
  out/          generated Luau — do not edit
  libs/         CluauppLibs (copied on build)`, "plain")}
<h2>IntelliSense</h2>
<p>Language completion is <code>clpp install</code>. <code>cluaupp intellisense</code> writes <code>files.associations</code> for <code>.clpp</code> / <code>.clp</code> / <code>.clh</code>. Reload the window after install.</p>
<p>Full command list: <a href="cli.html">CLI</a>. Config keys: <a href="config.html">Config</a>.</p>`,
	);

	page(
		"cli",
		"cli.html",
		"CLI",
		"Start",
		`<p class="muted">Every form the <code>cluaupp</code> (alias <code>cluau</code>) binary accepts. Omit <code>[folder]</code> and the current directory is used. Compile errors come from <code>clpp</code> and print <code>file:line:column</code>.</p>
${preCode(`cluaupp <command> [folder]
cluaupp --help
cluaupp --version
cluaupp -v`, "plain")}
<p>No command prints help. If <code>clpp</code> is missing, install <a href="https://github.com/KartzRbx/CLPP">CL++</a> or set <code>CLPP_PATH</code>.</p>
<h2>cluaupp init [folder]</h2>
<p>Copies the game template: <code>src/server</code>, <code>src/client</code>, <code>src/shared</code>, <code>cluaupp.config.json</code>, Rojo <code>default.project.json</code>, <code>rokit.toml</code> (Rojo 7.7.0), and CL++ samples.</p>
${preCode(`cluaupp init .
cluaupp init my-game`, "plain")}
<h2>cluaupp build [folder]</h2>
<p>Compiles <code>src/**/*.{clpp,clp,clh}</code> via <code>clpp api compile</code>, then post-processes Luau into <code>out/</code>. One tagged file becomes one Luau instance. After emit, orphans in <code>out/</code> are removed (deleted source → deleted Luau). <code>out/</code> itself is never wiped. <code>libs/</code> is fill-only: missing files restored, existing files never overwritten or deleted (Rojo 7 unwrap-crashes if a lib folder vanishes mid-serve).</p>
<table>
<tr><th>Flag</th><th>Does</th></tr>
<tr><td><code>-r, --rojo &lt;path&gt;</code></td><td>Rojo project for <code>require</code> mapping (default <code>./default.project.json</code>)</td></tr>
<tr><td><code>--format</code></td><td>Run StyLua on written Luau</td></tr>
<tr><td><code>--analyze</code></td><td>Run <code>luau-analyze</code> after emit</td></tr>
<tr><td><code>-i, --input</code> + <code>-o, --output</code></td><td>Single-file / directory path (see below)</td></tr>
<tr><td><code>--strict</code></td><td>Emit <code>--!strict</code> on the single-file path</td></tr>
</table>
${preCode(`cluaupp build
cluaupp build ./my-game
cluaupp build --format --analyze`, "plain")}
<h3>Single file</h3>
<p>Both <code>--input</code> and <code>--output</code> are required in this mode. Input may be one file or a directory of CL++. If output ends in <code>.luau</code>, input must be a single file.</p>
${preCode(`cluaupp build -i src/server/boot.server.clpp -o out/boot.server.luau --rojo default.project.json
cluaupp build --input ./src --output ./out --strict --format --analyze`, "plain")}
<h2>cluaupp watch [folder]</h2>
<p>Rebuilds when anything under <code>src/</code> changes, including deletes. Parse errors are printed; the watcher stays alive and <strong>does not write <code>out/</code></strong> until the project compiles cleanly. A second watcher in the same game exits. Watch never copies <code>libs/</code>.</p>
${preCode(`cluaupp watch
cluaupp watch ./my-game --format -r ./default.project.json`, "plain")}
<h2>cluaupp language</h2>
<p>Prints <code>clpp api manifest</code> (extensions, tags, operators).</p>
<h2>cluaupp lsp [folder]</h2>
<p>Delegates language services to CL++. Use <code>clpp install</code> for completion, hover, and definitions.</p>
<h2>cluaupp intellisense [folder]</h2>
<p>Alias: <code>intelisense</code>. Writes <code>files.associations</code> for CL++ and runs <code>clpp install</code>. Then reload the window.</p>
${preCode(`cluaupp intellisense
cluaupp intelisense .`, "plain")}
<h2>What build does not do</h2>
<ul>
<li>It does not parse CL++. That is <code>clpp</code>.</li>
<li>It does not invent Main / Controller folders (<code>"architecture": true</code> is not implemented on this path).</li>
<li>It does not emit <code>--!strict</code> unless <code>#pragma strict</code>, config <code>"strict": true</code>, or <code>--strict</code> on the single-file path. <code>#pragma nstrict</code> always wins.</li>
<li>Angle-bracket <code>#include &lt;clpp/...&gt;</code> is never inlined. Library headers inject <code>require(ReplicatedStorage.CluauppLibs.*)</code>.</li>
</ul>`,
	);

	page(
		"config",
		"config.html",
		"Config",
		"Start",
		`<p class="muted"><code>cluaupp.config.json</code> lives at the game root (next to <code>src/</code>). Missing file → these defaults.</p>
${preCode(`{
	"rootDir": "src",
	"outDir": "out",
	"strict": false,
	"architecture": false
}`, "json")}
<table>
<tr><th>Field</th><th>Default</th><th>Effect</th></tr>
<tr><td><code>rootDir</code></td><td><code>"src"</code></td><td>Where <code>.clpp</code> / <code>.clp</code> / <code>.clh</code> live</td></tr>
<tr><td><code>outDir</code></td><td><code>"out"</code></td><td>Where Luau is written — never edit</td></tr>
<tr><td><code>strict</code></td><td><code>false</code></td><td>Prefix <code>--!strict</code> (overridden by <code>#pragma strict</code> / <code>#pragma nstrict</code>)</td></tr>
<tr><td><code>architecture</code></td><td><code>false</code></td><td>Reserved. ForeverHD folder split is not implemented on the CL++ path</td></tr>
</table>
<h2>Rojo mapping (template)</h2>
<table>
<tr><th>Disk</th><th>Studio</th></tr>
<tr><td><code>out/server</code></td><td><code>ServerScriptService.Cluaupp</code></td></tr>
<tr><td><code>out/client</code></td><td><code>StarterPlayer.StarterPlayerScripts.Cluaupp</code></td></tr>
<tr><td><code>out/shared</code></td><td><code>ReplicatedStorage.Cluaupp</code></td></tr>
<tr><td><code>libs/</code></td><td><code>ReplicatedStorage.CluauppLibs</code></td></tr>
</table>
<p>Pragmas per file beat config: <a href="includes.html">Includes and pragmas</a>. Planner details: <a href="architecture.html">Architecture</a>.</p>`,
	);

	page(
		"intellisense",
		"intellisense.html",
		"IntelliSense",
		"Start",
		`<p class="muted">CL++ completion is <strong><code>clpp install</code></strong>. Cluaupp does not index the language. <code>cluaupp intellisense</code> only writes editor associations and runs the CL++ installer.</p>
<h2>What intellisense writes</h2>
<table>
<tr><th>File</th><th>Role</th></tr>
<tr><td><code>.vscode/settings.json</code></td><td><code>files.associations</code> for <code>.clpp</code> / <code>.clp</code> / <code>.clh</code></td></tr>
<tr><td>CL++ language pack</td><td>Installed by <code>clpp install</code> (hover, complete, diagnose)</td></tr>
</table>
<p>Put <code>#include &lt;clpp/roblox.clh&gt;</code> at the top of each source. Engine stubs are not compiled to Luau. After <code>cluaupp intellisense</code>, reload: Command Palette → Developer: Reload Window.</p>
<p>Language reference: <a href="https://kartzrbx.github.io/CLPP/">CL++ docs</a>.</p>`,
	);

	page(
		"project",
		"project.html",
		"Project layout",
		"Files",
		`<p class="muted">Disk layout is roblox-ts-shaped. The <strong>filename tag</strong> decides the Rojo class. Nothing else does — not the folder name, not SystemUnderstander roles.</p>
<table>
<tr><th>Folder</th><th>Runs on</th><th>Allowed to</th></tr>
<tr><td><code>src/server</code></td><td>Server</td><td>DataStore, DataService writes, <code>Net:Fire</code></td></tr>
<tr><td><code>src/client</code></td><td>Client</td><td>UI, input, <code>Net:FireServer</code></td></tr>
<tr><td><code>src/shared</code></td><td>Both</td><td>types, Template, <code>const</code> config</td></tr>
</table>
<p>If a file needs DataStoreService, it is server. If it needs UserInputService, it is client. Shared code must compile in both.</p>
<h2>One system per file</h2>
<p>Name the job: <code>leaderstats.server.clpp</code>, <code>hud.client.clpp</code>. Do not put shop UI in the leaderstats script. Do not edit <code>out/</code>.</p>
<p>Default emit is one tagged file → one <code>.server.luau</code> / <code>.client.luau</code>. Tags: <a href="files.html">File tags</a>. Includes: <a href="includes.html">Includes</a>.</p>`,
	);

	page(
		"files",
		"files.html",
		"File tags",
		"Files",
		`<p class="muted">The filename decides the Roblox instance — the same key idea as roblox-ts (<code>*.server.ts</code> → Script).</p>
<table>
<tr><th>Source</th><th>Studio</th><th>Output</th></tr>
<tr><td><code>leaderstats.server.clpp</code></td><td>Script</td><td><code>leaderstats.server.luau</code></td></tr>
<tr><td><code>hud.client.clpp</code></td><td>LocalScript</td><td><code>hud.client.luau</code></td></tr>
<tr><td><code>config.clp</code> (no tag)</td><td>ModuleScript</td><td><code>config.luau</code></td></tr>
<tr><td><code>PlayerData.clh</code></td><td>ModuleScript</td><td><code>PlayerData.luau</code></td></tr>
<tr><td>untagged <code>Name.clpp</code> with sibling <code>Name.clh</code></td><td>ModuleScript (skip auto <code>init</code>)</td><td><code>Name.luau</code></td></tr>
</table>
<p>Extensions accepted: <code>.clpp</code> <code>.clp</code> <code>.clh</code>.</p>
<h2>Sibling stem</h2>
<p>A header <code>PlayerData.clh</code> next to <code>PlayerData.clpp</code> (same stem, tags stripped) is the module pair. <code>#include "config.clh"</code> from a differently named file is a <code>require</code>, not an inline class body.</p>
<p>Scripts and LocalScripts call <code>init()</code> at the end if you defined it. ModuleScripts return a table and do not auto-run unless they also define <code>init()</code> (avoid that on shared modules).</p>`,
	);

	page(
		"includes",
		"includes.html",
		"Includes and pragmas",
		"Files",
		`<p class="muted"><code>clpp</code> owns includes. Cluaupp only rewrites library requires after compile.</p>
<h2>Quoted vs angle</h2>
<table>
<tr><th>Write</th><th>Toolchain</th></tr>
<tr><td><code>#include &lt;clpp/roblox.clh&gt;</code></td><td>Engine stub. Never inlined. Never <code>require</code>d.</td></tr>
<tr><td><code>#include &lt;clpp/libs/janitor.clh&gt;</code></td><td>Inject <code>require(ReplicatedStorage.CluauppLibs.Janitor)</code></td></tr>
<tr><td><code>#include "PlayerData.clh"</code> (same stem)</td><td>Own header pair</td></tr>
<tr><td><code>#include "config.clh"</code> (other file)</td><td><code>require</code> the compiled module</td></tr>
<tr><td><code>#include "../../shared/PlayerData.clh"</code></td><td><code>require</code> the shared module (Rojo path)</td></tr>
</table>
<p>A quoted include of an engine stub is skipped. Duplicate includes are skipped. After <code>clpp</code> emits Luau, Cluaupp rewrites <code>require(ClppLibs.X)</code> to <code>require(ReplicatedStorage.CluauppLibs.X)</code>.</p>
<h2>Pragmas</h2>
<table>
<tr><th>Line</th><th>Effect</th></tr>
<tr><td><code>#pragma once</code></td><td>Include guard</td></tr>
<tr><td><code>#pragma strict</code></td><td>This compilation unit emits <code>--!strict</code></td></tr>
<tr><td><code>#pragma nstrict</code></td><td>Never emit <code>--!strict</code>, even if config / <code>--strict</code></td></tr>
</table>
<p>Comments: <code>//</code> and <code>/* block */</code> never appear in Luau.</p>`,
	);

	registerCppLessons(page, { codePair, preCode, escapeHtml, mappingTable });

	page(
		"migration",
		"migration.html",
		"Migration",
		"Start",
		`<p class="muted">Cluaupp 1.0 compiles <strong>CL++</strong>, not a C++ subset. Language docs: <a href="https://kartzrbx.github.io/CLPP/">kartzrbx.github.io/CLPP</a>.</p>
<h2>Files</h2>
<table>
<tr><th>Before</th><th>After</th></tr>
<tr><td><code>*.server.cpp</code></td><td><code>*.server.clpp</code></td></tr>
<tr><td><code>*.client.cpp</code></td><td><code>*.client.clpp</code></td></tr>
<tr><td>untagged <code>*.cpp</code></td><td><code>*.clp</code></td></tr>
<tr><td><code>*.h</code> / <code>*.hpp</code></td><td><code>*.clh</code></td></tr>
</table>
<p><code>#include &lt;cluaupp/roblox.hpp&gt;</code> → <code>#include &lt;clpp/roblox.clh&gt;</code><br>
<code>#include &lt;cluaupp/libs/janitor.hpp&gt;</code> → <code>#include &lt;clpp/libs/janitor.clh&gt;</code><br>
Quoted includes: <code>"leaderstats.h"</code> → <code>"leaderstats.clh"</code>.</p>
<h2>Operators and IO</h2>
<table>
<tr><th>Old C++ subset</th><th>CL++</th><th>Luau</th></tr>
<tr><td><code>player-&gt;Name</code></td><td><code>player.Name</code></td><td><code>.</code></td></tr>
<tr><td><code>player-&gt;GetPlayers()</code></td><td><code>player::GetPlayers()</code></td><td><code>:</code></td></tr>
<tr><td><code>DataService::Server</code></td><td><code>DataService:Server</code></td><td><code>.</code></td></tr>
<tr><td><code>"hi " + name</code></td><td><code>"hi " .: name</code></td><td><code>..</code></td></tr>
<tr><td><code>signal.Connect(fn)</code></td><td><code>signal~&gt;Connect(fn)</code></td><td>Janitor <code>Add</code></td></tr>
<tr><td><code>print</code> / <code>error</code></td><td><code>post</code> / <code>report</code></td><td><code>print</code> / <code>error</code></td></tr>
<tr><td><code>nullptr</code></td><td><code>null</code></td><td><code>nil</code></td></tr>
<tr><td><code>[](Player* p) { }</code></td><td><code>func [](Player* p) { }</code></td><td><code>function</code></td></tr>
</table>
<h2>Workflow</h2>
<ol>
<li>Install CL++ from <a href="https://github.com/KartzRbx/CLPP">github.com/KartzRbx/CLPP</a> (<code>cargo install --path .</code>).</li>
<li><code>clpp install</code> (editor highlighting + IntelliSense).</li>
<li>Rename sources and apply the tables above.</li>
<li><code>cluaupp build</code> — <code>clpp</code> must be on PATH (<code>CLPP_PATH</code> if needed).</li>
</ol>
<p><code>"architecture": true</code> (ForeverHD folders) is not generated in 1.0. One source file still becomes one <code>.luau</code> file.</p>`,
	);

	page(
		"reference",
		"reference.html",
		"Language reference",
		"Language",
		`<p class="muted">Every construct the Cluaupp parser and emitter accept. If it is not in this table, do not write it. Details live on the linked pages.</p>
<h2>Files and CLI</h2>
<table>
<tr><th>Write</th><th>Becomes / does</th></tr>
<tr><td><code>.server.clpp</code> / <code>.client.clpp</code> / <code>.clp</code> / <code>.clh</code></td><td>Script / LocalScript / ModuleScript — <a href="files.html">tags</a></td></tr>
<tr><td><code>#include "Own.clh"</code> vs <code>#include "Other.clh"</code></td><td>sibling header vs <code>require</code> — <a href="includes.html">includes</a></td></tr>
<tr><td><code>#include &lt;clpp/libs/janitor.clh&gt;</code></td><td><code>require(ReplicatedStorage.CluauppLibs.Janitor)</code></td></tr>
<tr><td><code>#pragma strict</code> / <code>nstrict</code></td><td><code>--!strict</code> on/off</td></tr>
<tr><td><code>cluaupp init | build | watch | language | intellisense</code></td><td><a href="cli.html">CLI</a></td></tr>
</table>
<h2>Types</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>int</code> <code>float</code> <code>double</code></td><td><code>number</code></td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td></tr>
<tr><td><code>string</code></td><td><code>string</code> (not <code>std::string</code>)</td></tr>
<tr><td><code>void</code></td><td>no return annotation</td></tr>
<tr><td><code>auto</code> / <code>auto*</code></td><td>inferred from <code>new</code> / <code>GetService</code> / datatype ctor</td></tr>
<tr><td><code>Player*</code> <code>Folder*</code></td><td><code>Player</code> <code>Folder</code> (Instance handle)</td></tr>
<tr><td><code>LuaArray&lt;T&gt;</code> / <code>vector&lt;T&gt;</code></td><td><code>{T}</code></td></tr>
<tr><td><code>optional&lt;T&gt;</code></td><td><code>T?</code></td></tr>
<tr><td><code>const</code> / <code>static constexpr</code></td><td>Luau <code>const</code></td></tr>
<tr><td><code>nullptr</code></td><td><code>nil</code></td></tr>
<tr><td><code>Vector3</code> <code>CFrame</code> <code>UDim2</code> <code>Color3</code></td><td>same names, copied values</td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td><code>Enum.Material.Plastic</code></td></tr>
</table>
<h2>Declarations and OOP</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>int coins = 0;</code></td><td><code>local coins: number = 0</code></td></tr>
<tr><td><code>const int MAX = 20;</code></td><td><code>const MAX: number = 20</code></td></tr>
<tr><td><code>struct Name { fields; methods; }</code></td><td>table + colon methods / constructor — <a href="structs.html">structs</a></td></tr>
<tr><td><code>void Name::Method(T* x) { }</code></td><td><code>function Name:Method(x: T)</code></td></tr>
<tr><td><code>this</code> / bare field in a method</td><td><code>self</code> / <code>self.field</code></td></tr>
<tr><td><code>void init() { }</code></td><td><code>const function init()</code> then <code>init()</code> at file end</td></tr>
<tr><td>prototype in a <code>.h</code></td><td><code>export type</code> field, no body</td></tr>
<tr><td><code>static</code> <code>inline</code> specifiers</td><td>ignored (except they can mark <code>const</code>)</td></tr>
<tr><td><code>public:</code> / <code>private:</code> / <code>protected:</code></td><td>ignored</td></tr>
<tr><td>nested structs</td><td>nested Luau tables (Templates)</td></tr>
<tr><td><code>Name obj;</code> where <code>Name</code> is a struct</td><td><code>local obj = Name</code> (the table) — <a href="singletons.html">singletons</a></td></tr>
</table>
<h2>Control, operators, strings</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>if (x) { } else { }</code></td><td><code>if x then … else … end</code></td></tr>
<tr><td><code>while (x) { }</code></td><td><code>while x do … end</code></td></tr>
<tr><td><code>for (T* x : list)</code></td><td><code>for _, x in list do</code> — range-for only</td></tr>
<tr><td><code>switch / case / default / break</code></td><td><code>repeat</code> + <code>if</code> / <code>elseif</code> — <a href="control-flow.html">control</a></td></tr>
<tr><td><code>return;</code> / <code>return x;</code></td><td><code>return</code> / <code>return x</code></td></tr>
<tr><td><code>== != &lt; &gt; &lt;= &gt;= + - * /</code></td><td>same, except <code>!=</code> → <code>~=</code></td></tr>
<tr><td><code>&amp;&amp;</code> <code>||</code> <code>!</code></td><td><code>and</code> <code>or</code> <code>not</code></td></tr>
<tr><td>unary <code>-</code></td><td><code>-</code></td></tr>
<tr><td><code>=</code> assignment</td><td><code>=</code></td></tr>
<tr><td>string <code>+</code> / <code>string_concat(a, b, c)</code></td><td><code>..</code> — <a href="strings.html">strings</a></td></tr>
<tr><td><code>true</code> <code>false</code></td><td>same</td></tr>
</table>
<h2>Engine, callbacks, casts</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>new Folder(player)</code></td><td><code>Instance.new("Folder")</code> + <code>.Parent = player</code></td></tr>
<tr><td><code>new Janitor()</code></td><td><code>Janitor.new()</code></td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>part-&gt;Name</code></td><td><code>part.Name</code> (property)</td></tr>
<tr><td><code>player-&gt;FindFirstChild("x")</code></td><td><code>player:FindFirstChild("x")</code> (method)</td></tr>
<tr><td><code>CFrame::lookAt(a, b)</code></td><td><code>CFrame.lookAt(a, b)</code></td></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>signal~&gt;Connect(fn)</code> / <code>func []</code></td><td>Janitor <code>Add</code> + <code>Connect</code> — <a href="events.html">callbacks</a></td></tr>
<tr><td><code>static_cast&lt;Folder*&gt;(x)</code> / <code>(void)x</code></td><td>the value / omitted — <a href="casts.html">casts</a></td></tr>
<tr><td><code>Type { .Field = value }</code></td><td><code>{ Field = value }</code></td></tr>
<tr><td><code>post</code> / <code>warn</code> / <code>report</code></td><td><code>print(…)</code> — <a href="logging.html">logging</a></td></tr>
<tr><td>globals <code>game</code> <code>workspace</code> <code>script</code></td><td>same</td></tr>
<tr><td><code>tick()</code> <code>wait()</code> <code>spawn(fn)</code> <code>delay(s, fn)</code></td><td>same Roblox globals</td></tr>
</table>
<h2>Not in the subset</h2>
<p>ISO C++ is not CL++. See <a href="migration.html">Migration</a> and the <a href="https://kartzrbx.github.io/CLPP/">CL++ language</a>.</p>`,
	);

	page(
		"types",
		"types.html",
		"5. Data types",
		"CL++ class",
		`<p class="muted">Lesson 5 — like <a href="https://www.w3schools.com/CPP/cpp_data_types.asp">W3Schools Data Types</a>. A type tells the compiler what a box holds. Cluaupp maps that to a Luau annotation (see <a href="luau.html">The Luau you emit</a>).</p>
<table>
<tr><th>CL++</th><th>Luau</th><th>Use</th></tr>
<tr><td><code>int</code> / <code>float</code> / <code>double</code></td><td><code>number</code></td><td>counts vs world units — same at runtime</td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td><td>flags</td></tr>
<tr><td><code>string</code></td><td><code>string</code></td><td>names, keys — not <code>std::string</code></td></tr>
<tr><td><code>void</code></td><td>(no return)</td><td>procedures</td></tr>
<tr><td><code>auto</code> / <code>auto*</code></td><td>inferred</td><td><code>new</code> / <code>GetService</code> / datatype ctor</td></tr>
<tr><td><code>Player*</code> / <code>Folder*</code></td><td><code>Player</code> / <code>Folder</code></td><td>Instance handle</td></tr>
<tr><td><code>nullptr</code></td><td><code>nil</code></td><td>missing child</td></tr>
<tr><td><code>Vector3</code>, <code>CFrame</code>, <code>UDim2</code></td><td>same names</td><td>datatypes (copied values)</td></tr>
</table>
${codePair(
	`int coins = 10;
const int STARTING_COINS = 0;
bool ready = true;
string name = "Kartz";
auto* folder = new Folder(player);`,
	`local coins: number = 10
const STARTING_COINS: number = 0
local ready: boolean = true
local name: string = "Kartz"
local folder: Folder = Instance.new("Folder")
folder.Parent = player`,
)}
<p>Always initialize: <code>int coins = 0;</code> not <code>int coins;</code> (uninitialized becomes <code>nil</code> in emit).</p>
<h2>Pointers are Instances</h2>
<p><code>Player*</code> is not a heap address. There is no <code>delete</code>, no <code>*part</code>, no <code>&amp;part</code>, no pointer arithmetic. <code>-&gt;</code> writes the DataModel object. Two variables can hold the same Instance.</p>
${codePair(
	`void Paint(Part* part) {
	part->Anchored = true;
}`,
	`const function Paint(part: Part)
	part.Anchored = true
end`,
)}
<p>Numbers and datatypes copy. To mutate a number the caller owns, <code>return</code> it or store it on an <code>IntValue*</code> / DataService path. C++ <code>int&amp;</code> is not in the subset.</p>
<p class="note"><code>const Folder* stats</code> still has a mutable <code>Name</code> in Roblox. <code>const</code> protects the variable, not the Instance behind it.</p>
<p>Next: <a href="operators.html">6. Operators</a>. Arrays and optionals: <a href="advanced-types.html">Advanced types</a>.</p>`,
	);

	page(
		"advanced-types",
		"advanced-types.html",
		"Advanced types",
		"Language",
		`<p class="muted">Beyond primitives: arrays, optionals, nested structs, enums, and what <code>auto</code> actually infers.</p>
<h2>LuaArray&lt;T&gt; and vector&lt;T&gt;</h2>
<p>Stand-in for a Luau array. <code>GetPlayers()</code> is <code>LuaArray&lt;Player*&gt;</code> in the headers. Template inventory fields use the same type. Aliases <code>vector&lt;T&gt;</code>, <code>array&lt;T&gt;</code>, <code>span&lt;T&gt;</code>, and <code>std::vector&lt;T&gt;</code> map the same way. Emit type: <code>{T}</code>.</p>
${codePair(
	`LuaArray<int> hotBar;
LuaArray<string> storage;
LuaArray<Player*> players = GetService<Players>()->GetPlayers();`,
	`local hotBar: {number} = nil
local storage: {string} = nil
local players: {Player} = game:GetService("Players"):GetPlayers()`,
)}
<p>Iterate with range-<code>for</code>. There is no <code>hotBar[i]</code> emit and no <code>push_back</code> — mutate arrays through DataService array helpers or rebuild the table in Luau-facing APIs.</p>
<h2>optional&lt;T&gt;</h2>
<p><code>optional&lt;T&gt;</code> / <code>std::optional&lt;T&gt;</code> becomes Luau <code>T?</code>. Prefer <code>nullptr</code> checks on Instances.</p>
<h2>Nested structs (Templates)</h2>
<p>A struct of structs with defaulted fields becomes a nested Luau table. That is the DataService save shape. <code>LuaArray</code> fields stay on the table (they used to be dropped).</p>
${preCode(`struct PlayerDataInventory {
	LuaArray<int> HotBar;
	LuaArray<string> Storage;
	int MaxStorage = 90;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
	PlayerDataInventory Inventory;
};`, "cpp")}
<h2>auto inference</h2>
<p><code>auto</code> / <code>auto*</code> picks a Luau annotation when the value is:</p>
<ul>
<li><code>new Class(...)</code> → that class</li>
<li><code>GetService&lt;T&gt;()</code> → <code>T</code></li>
<li>a datatype constructor <code>Vector3(...)</code> → <code>Vector3</code></li>
</ul>
<p>Otherwise the annotation is omitted. Prefer writing the type on parameters and struct fields.</p>
<h2>Enums</h2>
<p><code>Enum::Name::Item</code> → <code>Enum.Name.Item</code>. Look items up on Creator Hub. Cluaupp does not generate a page per enum.</p>
<h2>Specifiers</h2>
<p><code>const</code>, <code>constexpr</code>, <code>static</code>, <code>inline</code> may precede a declaration. <code>const</code> / <code>constexpr</code> mark Luau <code>const</code>. <code>static</code> / <code>inline</code> do not emit extra Luau. <code>volatile</code> is stripped from type names in the Tree-sitter mapper only.</p>`,
	);

	page(
		"functions",
		"functions.html",
		"10. Functions",
		"CL++ class",
		`<p class="muted">Lesson 10 — like <a href="https://www.w3schools.com/CPP/cpp_functions.asp">W3Schools Functions</a>. A function is a block that runs when you call it. You pass parameters in. You reuse the body.</p>
<h2>Create a function</h2>
<p><code>void</code> means no return value. Parentheses <code>()</code> hold parameters (empty for none). Braces hold the body:</p>
${codePair(
	`void SayHello() {
	print("I just got executed!");
}

void init() {
	SayHello();
	SayHello();
}`,
	`const function SayHello()
	print("I just got executed!")
end

const function init()
	SayHello()
	SayHello()
end`,
)}
<p>Call it by writing the name, <code>()</code>, and <code>;</code>. It can run many times. Prototypes without a body are skipped in a <code>.cpp</code> — put the body in the same file or on <code>Class::</code> in the sibling implementation.</p>
<p>Only functions with a body are emitted. There is no overloading — one name, one emit. Lambdas (mini functions in place): <a href="lambdas.html">11. Lambdas</a>.</p>
<h2>Free functions</h2>
${codePair(
	`void CreateLeaderstats(Player* player) {
	return;
}

int DoubleCoins(int coins) {
	return coins * 2;
}`,
	`const function CreateLeaderstats(player: Player)
	return
end

const function DoubleCoins(coins: number): number
	return coins * 2
end`,
)}
<p><code>void</code> omits a return annotation. <code>int</code> / <code>float</code> / <code>double</code> → <code>: number</code>. <code>bool</code> → <code>: boolean</code>. Roblox types keep their name. <code>Folder*</code> as a return is <code>: Folder</code>.</p>
<h2>void init()</h2>
<p>If a file defines <code>void init()</code>, Cluaupp appends <code>init()</code> at the end of Scripts and LocalScripts. That is the boot — there is no <code>int main()</code>. Shared ModuleScripts should not define <code>init()</code> unless you want them to run on <code>require</code>.</p>
<h2>Class:: methods</h2>
${codePair(
	`string LeaderstatsServer::GetPlayerJanitorKey(Player* player) {
	return string_concat(player->Name, "_LeaderstatsJanitor");
}`,
	`function LeaderstatsServer:GetPlayerJanitorKey(player: Player): string
	return (player.Name .. "_LeaderstatsJanitor")
end`,
)}
<p>Inside a method, bare field names become <code>self.field</code>. Bare calls to other methods of the same struct become <code>self:Method(...)</code>. <code>this</code> is <code>self</code>.</p>
<h2>Prototypes</h2>
<p>A declaration with <code>;</code> and no body is a prototype. In a <code>.h</code> it becomes an <code>export type</code> member. The <code>.cpp</code> must provide the body. Function prototypes at the top of a <code>.cpp</code> are skipped (not emitted twice).</p>
<h2>Parameters</h2>
<p>Write a type and a name: <code>Player* player</code>. A typed nameless parameter becomes <code>arg</code>. There are no default arguments in emit. There are no C++ references (<code>int&amp;</code>).</p>
<h2>Passing functions</h2>
<p>Pass a free function by name: <code>players-&gt;PlayerAdded.Connect(OnPlayer)</code>. Pass a method of the current struct and Cluaupp binds <code>self</code>: <code>function(...) self:OnPlayer(...) end</code>. Mini functions in place: <a href="lambdas.html">11. Lambdas</a>.</p>`,
	);

	page(
		"scopes",
		"scopes.html",
		"12. Scopes",
		"CL++ class",
		`<p class="muted">Cluaupp has file scope, function scope, and method <code>self</code>. It does not have C++ namespaces as tables, and it does not have <code>int&amp;</code> lifetime.</p>
<h2>File scope</h2>
<p>Top-level <code>int coins = 0;</code> becomes a file-level <code>local</code> (or <code>const</code>). Top-level functions are <code>const function</code>. They are visible to later functions in the same file. There is no <code>static</code> linkage — <code>static</code> only helps mark constants.</p>
<h2>Function / block locals</h2>
<p>A declaration inside a function is <code>local</code>. Nested <code>{ }</code> still emit <code>local</code> in that block. Luau sees the local from its line to the end of the block. Shadow a name on purpose; do not reuse <code>player</code> for a Folder.</p>
${codePair(
	`void Give(Player* player) {
	int amount = 1;
	if (player) {
		int amount = 5;
		print(amount);
	}
	print(amount);
}`,
	`const function Give(player: Player)
	local amount: number = 1
	if player then
		local amount: number = 5
		print(amount)
	end
	print(amount)
end`,
)}
<h2>Method self</h2>
<p>In <code>Class::Method</code>, names that match struct fields and are not locals/params become <code>self.name</code>. Parameters shadow fields. Locals shadow fields. Globals (<code>print</code>, <code>game</code>, library types, Instance types, datatypes) stay bare.</p>
${codePair(
	`void LeaderstatsServer::PlayerEntered(Player* player) {
	janitor->Add(folder, "Destroy", GetPlayerJanitorKey(player));
}`,
	`function LeaderstatsServer:PlayerEntered(player: Player)
	self.janitor:Add(folder, "Destroy", self:GetPlayerJanitorKey(player))
end`,
)}
<h2>What is not a scope</h2>
<ul>
<li><code>namespace N { }</code> is flattened into the file.</li>
<li><code>using …;</code> is dropped.</li>
<li><code>public:</code> / <code>private:</code> do not hide fields. Everything on the struct is on the table.</li>
<li>Instances are not C++ RAII. Leaving a block does not Destroy a Part. Use Janitor or <code>.Parent = nullptr</code>.</li>
</ul>
<p>Construct one service table in <code>init()</code> and keep it in that function’s locals (a closure over lambdas): <a href="singletons.html">Singletons</a>.</p>`,
	);

	page(
		"control",
		"control-flow.html",
		"9. If, while, for",
		"CL++ class",
		`<p class="muted">Lesson 9 — conditions and loops. W3Schools splits these across If, While, For, Switch. Cluaupp has <code>if</code> / <code>else</code>, <code>while</code>, range-<code>for</code>, and <code>switch</code>. There is no C-style <code>for (int i = 0; …)</code> and no <code>do/while</code>.</p>
${codePair(
	`if (coinsValue) {
	coinsValue->Value = newValue;
} else {
	warn("missing Coins");
}

while (true) {
	print("tick");
}

for (Player* player : players->GetPlayers()) {
	leaderstatsServer.PlayerEntered(player);
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
	`if coinsValue then
	coinsValue.Value = newValue
else
	warn("missing Coins")
end

while true do
	print("tick")
end

for _, player in players:GetPlayers() do
	leaderstatsServer:PlayerEntered(player)
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
<h2>if / else</h2>
<p>The condition is an expression. A missing Instance is <code>nullptr</code> / <code>nil</code>, which is falsy: <code>if (existingFolder)</code> is enough after <code>FindFirstChild</code>. <code>else if (x)</code> compiles as a nested <code>if</code> inside <code>else</code> (not Luau <code>elseif</code>). Prefer <code>switch</code> for many string cases.</p>
<p>Single-statement bodies without braces are accepted: <code>if (x) return;</code>.</p>
<h2>while</h2>
<p><code>while (test) { body }</code> → <code>while test do … end</code>. There is no <code>do { } while</code>.</p>
<h2>Range-for</h2>
<p>The only <code>for</code> accepted: <code>for (Type* x : list)</code> or <code>for (auto* x : list)</code> or <code>for (const auto* x : list)</code>. C-style <code>for (int i = 0; i &lt; n; i++)</code> is a parse error. Emit is <code>for _, x in list do</code> (Luau generic for, first return discarded).</p>
<h2>switch</h2>
<p>The discriminant is evaluated once. Stacked <code>case</code> labels share a body (<code>case "buy": case "purchase":</code>). There is no C-style fall-through into the next case’s statements. <code>break</code> leaves the switch even from inside an <code>if</code>, because the whole switch is <code>repeat … until true</code>. <code>default</code> is <code>else</code>.</p>
<p>Complex discriminants are stored in a local <code>__switchN</code> so they are not re-evaluated.</p>
<h2>return and break</h2>
<p><code>return;</code> / <code>return expr;</code>. <code>break</code> exists for switch (and would also leave a <code>while</code> / range-<code>for</code>). There is no <code>continue</code>, no <code>goto</code>.</p>`,
	);

	page(
		"operators",
		"operators.html",
		"6. Operators",
		"CL++ class",
		`<p class="muted">Binary operators are left-associative in this subset (no C++ precedence table). Use parentheses when mixing arithmetic and compares.</p>
${mappingTable ? mappingTable() : ""}
<h2>Arithmetic and compare</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>+</code> <code>-</code> <code>*</code> <code>/</code></td><td>same (<code>*</code> is multiply, not dereference)</td></tr>
<tr><td>unary <code>-</code> <code>!</code></td><td><code>-</code> <code>not</code></td></tr>
<tr><td><code>==</code> <code>!=</code> <code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code></td><td><code>==</code> <code>~=</code> and the rest same</td></tr>
<tr><td><code>&amp;&amp;</code> <code>||</code></td><td><code>and</code> <code>or</code></td></tr>
<tr><td><code>=</code></td><td>assignment (right-associative)</td></tr>
<tr><td>string <code>+</code></td><td><code>..</code> when a side is a literal, concat, or <code>.Name</code> / <code>.Text</code> / <code>.DisplayName</code></td></tr>
<tr><td><code>&lt;&lt;</code></td><td><code>cout</code> / <code>cerr</code> streams only — <a href="logging.html">logging</a></td></tr>
</table>
<h2>Member access</h2>
<table>
<tr><th>CL++</th><th>When</th><th>Luau</th></tr>
<tr><td><code>part-&gt;Size</code></td><td>Instance / table property</td><td><code>part.Size</code></td></tr>
<tr><td><code>part-&gt;FindFirstChild("x")</code></td><td>engine or library method</td><td><code>part:FindFirstChild("x")</code></td></tr>
<tr><td><code>players-&gt;PlayerAdded.Connect(fn)</code></td><td>signal</td><td><code>players.PlayerAdded:Connect(fn)</code></td></tr>
<tr><td><code>CFrame::lookAt(a, b)</code></td><td>datatype / enum / module static</td><td><code>CFrame.lookAt(a, b)</code></td></tr>
<tr><td><code>DataService::Server.Init(opts)</code></td><td>library singleton method</td><td><code>DataService.Server:Init(opts)</code></td></tr>
<tr><td><code>Module3D::Attach3D(a, b)</code></td><td>colon statics (<code>MODULE_COLON</code>)</td><td><code>Module3D:Attach3D(a, b)</code></td></tr>
<tr><td><code>obj.Field</code></td><td>dot in C++</td><td><code>obj.Field</code></td></tr>
</table>
<h2>Not operators here</h2>
<p>No <code>++</code> <code>--</code> <code>+=</code> <code>-=</code> <code>*=</code> <code>/=</code>. No <code>?</code> <code>:</code> ternary. No <code>&amp;</code> address-of, no <code>*</code> dereference, no <code>-&gt;*</code>. Write <code>n = n + 1</code>.</p>
<p>Next: <a href="strings.html">7. Strings</a>.</p>`,
	);

	page(
		"strings",
		"strings.html",
		"7. Strings",
		"CL++ class",
		`<p class="muted">Luau concatenates with <code>..</code>. Cluaupp gives you two C++ forms that emit that. Do not write Luau <code>..</code> inside a <code>.cpp</code>.</p>
<p><code>string</code> in the headers is <code>const char*</code>. Quoted literals are <code>"text"</code> (escapes <code>\\</code> work). There are no raw string literals and no <code>'c'</code> chars.</p>
<h2>Operator +</h2>
<p>If either side is a string literal, another concat, or a member named <code>Name</code> / <code>Text</code> / <code>DisplayName</code>, <code>+</code> becomes <code>..</code>. Numeric <code>+</code> stays arithmetic.</p>
${codePair(
	`return player->Name + "_LeaderstatsJanitor";
string label = "Coins: " + name;`,
	`return player.Name .. "_LeaderstatsJanitor"
local label: string = "Coins: " .. name`,
)}
<h2>string_concat</h2>
<p>Variadic join declared in <code>datatypes.hpp</code> (pulled in by <code>roblox.hpp</code>). Zero arguments → <code>""</code>. One argument → that value. Several → <code>(a .. b .. c)</code>.</p>
${codePair(
	`return string_concat(player->Name, "_", "LeaderstatsJanitor");
string empty = string_concat();
string one = string_concat(name);`,
	`return (player.Name .. "_" .. "LeaderstatsJanitor")
local empty: string = ""
local one: string = name`,
)}
<p>Use <code>string_concat</code> when more than two pieces, or when a piece is not a <code>.Name</code> / literal (so <code>+</code> would stay arithmetic). Logging is not concat — use <a href="logging.html">print / cout</a>.</p>`,
	);

	page(
		"logging",
		"logging.html",
		"2. Output",
		"CL++ class",
		`<p class="muted">Lesson 2 — output. CL++ uses <code>post</code> / <code>warn</code> / <code>report</code>. Those emit Roblox <code>print</code> / <code>warn</code> / <code>error</code>.</p>
${codePair(
	`print("ok");
warn("careful");
error("fail");
cout << "EnsureStat: " << name << " not found" << endl;
cerr << "failed" << endl;
cout::print("ok");
cout::warn("careful");
cout::error("fail");
cout::ping("here");
cout::endl();`,
	`print("ok")
warn("careful")
error("fail")
print("EnsureStat: ", name, " not found")
warn("failed")
print("ok")
warn("careful")
error("fail")
print("here")
print()`,
)}
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>cout &lt;&lt; … &lt;&lt; endl</code></td><td><code>print(…)</code> — each <code>&lt;&lt;</code> is another argument; <code>endl</code> flushes the statement</td></tr>
<tr><td><code>cerr &lt;&lt; …</code></td><td><code>warn(…)</code></td></tr>
<tr><td><code>cout::print</code> / <code>cout::ping</code></td><td><code>print</code></td></tr>
<tr><td><code>cout::warn</code></td><td><code>warn</code></td></tr>
<tr><td><code>cout::error</code></td><td><code>error</code></td></tr>
<tr><td><code>cout::endl()</code></td><td><code>print()</code></td></tr>
</table>
<p><code>cout</code> / <code>cerr</code> / <code>endl</code> live in <code>roblox.hpp</code> so clangd accepts them. They must not leak into Luau.</p>
<p>Next: <a href="comments.html">3. Comments</a>.</p>`,
	);

	page(
		"casts",
		"casts.html",
		"Casts",
		"Language",
		`<p class="muted">Luau has no casts. Cluaupp accepts C++ spellings so clangd is happy, then emits the value.</p>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>static_cast&lt;Folder*&gt;(inst)</code></td><td><code>inst</code></td></tr>
<tr><td><code>const_cast</code> / <code>reinterpret_cast</code> / <code>dynamic_cast</code></td><td>same — the argument</td></tr>
<tr><td><code>(void)x;</code></td><td>omitted (marks unused for clangd)</td></tr>
<tr><td><code>(Folder*)inst</code> C-style</td><td>the argument if parsed as a cast</td></tr>
</table>
${codePair(
	`Folder* AsFolder(Instance* inst) {
	(void)inst;
	return static_cast<Folder*>(inst);
}`,
	`const function AsFolder(inst: Instance): Folder
	return inst
end`,
)}
<p>Still test <code>FindFirstChild</code> before using the result. A cast does not check ClassName at runtime.</p>`,
	);

	page(
		"vs-cpp",
		"vs-cpp.html",
		"Syntax vs C++",
		"Language",
		`<p class="muted">CL++ looks C-like. It is <strong>not</strong> ISO C++. <code>clpp</code> compiles it. Cluaupp does not. Coming from the old Cluaupp C++ subset: <a href="migration.html">Migration</a>.</p>
<h2>CL++ writes</h2>
<table>
<tr><th>Area</th><th>Write</th></tr>
<tr><td>Files</td><td><code>.clpp</code> <code>.clp</code> <code>.clh</code>, tags <code>.server</code> <code>.client</code>, quoted includes, <code>#pragma strict</code></td></tr>
<tr><td>Types</td><td><code>int</code> <code>bool</code> <code>string</code> <code>void</code> <code>auto</code> <code>*</code> Instances, datatypes, <code>Enum::</code></td></tr>
<tr><td>Engine</td><td><code>new Class(parent)</code>, <code>GetService&lt;T&gt;()</code>, <code>.</code> properties, <code>::</code> methods</td></tr>
<tr><td>Control</td><td><code>if</code> / <code>else</code>, <code>while</code>, range-<code>for</code>, <code>guard</code>, <code>match</code>, <code>return</code></td></tr>
<tr><td>Exprs</td><td><code>== != &amp;&amp; || !</code>, concat <code>.:</code>, janitor <code>~&gt;</code>, <code>func []</code> lambdas</td></tr>
<tr><td>IO</td><td><code>post</code> / <code>warn</code> / <code>report</code>, <code>null</code></td></tr>
<tr><td>Boot</td><td><code>void init()</code> called at end of Scripts / LocalScripts</td></tr>
</table>
<h2>Not ISO C++</h2>
<table>
<tr><th>Full C++</th><th>CL++</th></tr>
<tr><td><code>.cpp</code> / clangd / <code>ms-vscode.cpptools</code></td><td><code>.clpp</code> and <code>clpp install</code></td></tr>
<tr><td><code>std::string</code>, <code>std::vector</code></td><td><code>string</code>, arrays</td></tr>
<tr><td><code>player-&gt;Name</code></td><td><code>player.Name</code></td></tr>
<tr><td><code>player-&gt;GetPlayers()</code></td><td><code>player::GetPlayers()</code></td></tr>
<tr><td><code>int main()</code> / <code>iostream</code></td><td><code>void init()</code> / <code>clpp/roblox.clh</code></td></tr>
<tr><td><code>nullptr</code> / <code>print</code></td><td><code>null</code> / <code>post</code></td></tr>
<tr><td><code>cin</code></td><td>TextBox, UserInputService, remotes</td></tr>
</table>
<p>Language course: <a href="https://kartzrbx.github.io/CLPP/">kartzrbx.github.io/CLPP</a>. Cheat sheet: <a href="reference.html">Language reference</a>.</p>`,
	);

	page(
		"structs",
		"structs.html",
		"13. Structs and methods",
		"CL++ class",
		`<p class="muted">This is how you write a type in CL++. A <code>struct</code> (or <code>class</code>) in the <code>.clh</code> is the public shape. <code>Class::Method</code> in the <code>.clpp</code> is the implementation.</p>
<h2>Header — the type</h2>
${preCode(`#pragma once
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>
#include <clpp/libs/dataservice.clh>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;

	Players* players;
	Janitor* janitor;

	string GetPlayerJanitorKey(Player* player);
	void UpdateLeaderstatsWithValues(IntValue* currentValue, int newValue);
	Folder* EnsurePlayerLeaderstatsFolder(Player* player);
	void PlayerEntered(Player* player);
};`, "cpp")}
<ul>
<li><code>static constexpr int</code> becomes a Luau <code>const</code>.</li>
<li>Fields (<code>Janitor* janitor</code>) live on the table as <code>self.janitor</code>.</li>
<li>Method declarations have no bodies. Bodies go in the sibling <code>.clpp</code>.</li>
<li><code>public:</code> / <code>private:</code> / <code>protected:</code> are accepted and ignored.</li>
</ul>
<h2>Cpp — the methods</h2>
${preCode(`#include "LeaderstatsServer.clh"

string LeaderstatsServer::GetPlayerJanitorKey(Player* player) {
	return string_concat(player->Name, "_LeaderstatsJanitor");
}

void LeaderstatsServer::UpdateLeaderstatsWithValues(IntValue* currentValue, int newValue) {
	if (currentValue->Value != newValue) {
		currentValue->Value = newValue;
	}
}`, "cpp")}
<p>Emit uses colon methods: <code>function LeaderstatsServer:GetPlayerJanitorKey(player: Player)</code>. Inside the body, <code>this</code> is <code>self</code>, fields become <code>self.janitor</code>, other methods become <code>self:PlayerEntered</code>.</p>
<h2>Boot</h2>
<p>Construct the table, assign fields, hook signals in <code>void init()</code>. Untagged files that only define <code>Class::</code> methods <code>return</code> the table (ModuleScript). A <code>.server.clpp</code> with <code>init()</code> runs as a Script. If every function is a <code>Class::</code> method, emit also aliases <code>Start</code> / <code>Init</code> to <code>init</code> when <code>init</code> exists, then <code>return Class</code>.</p>
<h2>Data Template (nested structs)</h2>
<p>Save shape is yours. Nested structs with defaults become nested Luau tables. Pass that value to <code>DataService::Server.Init</code> once. Gameplay uses <code>DataService::Server.Paths....</code> — not a local <code>int Coins</code>.</p>
${preCode(`#pragma once
#include <clpp/datatypes.clh>

struct PlayerDataCurrencies {
	int Coins = 0;
	int Rebirths = 0;
};

struct PlayerDataInventory {
	LuaArray<int> HotBar;
	LuaArray<string> Storage;
	int MaxStorage = 90;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
	PlayerDataInventory Inventory;
};`, "cpp")}
<h2>Designated initializers</h2>
${codePair(
	`DataService::Server.Init(DataServiceOptions {
	.Template = playerData,
	.StoreName = "PlayerData",
	.UseMock = true,
});`,
	`DataService.Server:Init({
	Template = playerData,
	StoreName = "PlayerData",
	UseMock = true,
})`,
)}
<p>Empty <code>Type {}</code> is <code>{}</code>. Nested braces work the same way. This is how you pass option tables without inventing JSON.</p>
<p>One instance in <code>init()</code>: <a href="singletons.html">Singletons</a>. Header-only vs sibling Impl: <a href="modules.html">Modules</a>.</p>`,
	);

	page(
		"singletons",
		"singletons.html",
		"Singletons",
		"OOP",
		`<p class="muted">Cluaupp has no <code>static LeaderstatsServer instance;</code> that becomes a Luau singleton automatically. You construct <strong>one</strong> table in <code>init()</code>, or you call a library singleton that already exists.</p>
<h2>Library singletons</h2>
<p><code>DataService::Server</code> and <code>DataService::Client</code> are the library’s APIs. Call <code>Init</code> once from a boot script. Other systems only <code>WaitFor</code>. Do not construct a second DataService.</p>
${codePair(
	`DataService::Server.Init(DataServiceOptions {
	.Template = playerData,
	.StoreName = "PlayerData",
	.UseMock = true,
});
Data* data = DataService::Server.WaitFor(player);`,
	`DataService.Server:Init({
	Template = playerData,
	StoreName = "PlayerData",
	UseMock = true,
})
local data = DataService.Server:WaitFor(player)`,
)}
<p>Same idea: <code>Net::Event("Coins")</code> is a named remote, not a class you <code>new</code> twice with different meanings. Cmdr / Fusion scoped objects follow the upstream README — one Init, then use.</p>
<h2>Your service: one struct in init()</h2>
<p>The canonical game singleton is a local in <code>init()</code>. Lambdas capture it (<code>[&amp;]</code>). That local lives for the Script’s lifetime.</p>
${codePair(
	`void init() {
	Players* players = GetService<Players>();
	LeaderstatsServer leaderstatsServer;
	leaderstatsServer.janitor = new Janitor();
	for (Player* player : players->GetPlayers()) {
		leaderstatsServer.PlayerEntered(player);
	}
	players->PlayerAdded.Connect([&](Player* playerEntered) {
		leaderstatsServer.PlayerEntered(playerEntered);
	});
	game->BindToClose([&]() {
		leaderstatsServer.janitor->Cleanup();
	});
}`,
	`const function init()
	local players: Players = game:GetService("Players")
	local leaderstatsServer: LeaderstatsServer = LeaderstatsServer
	leaderstatsServer.janitor = Janitor.new()
	for _, player in players:GetPlayers() do
		leaderstatsServer:PlayerEntered(player)
	end
	players.PlayerAdded:Connect(function(playerEntered: Player)
		leaderstatsServer:PlayerEntered(playerEntered)
	end)
	game:BindToClose(function()
		leaderstatsServer.janitor:Cleanup()
	end)
end

init()`,
)}
<p><code>LeaderstatsServer leaderstatsServer;</code> where <code>LeaderstatsServer</code> is the struct/table copies the module table into a local. Assign fields on that local. Do not <code>new LeaderstatsServer()</code> — it is not an Instance.</p>
<h2>Header-only constructors</h2>
<p>A shared struct with only fields (no <code>Class::</code> methods) emits <code>const function PlayerData()</code> that returns a table of defaults. Call <code>PlayerData playerData = PlayerData {};</code> then pass it as <code>.Template</code>. That is a value, not a process singleton.</p>
<h2>What not to do</h2>
<ul>
<li>Mutable file-scope state in <code>src/shared</code> (server and client would each get a copy).</li>
<li>A second <code>DataService::Server.Init</code> from leaderstats / HUD.</li>
<li>A global Janitor for every player — key per player, or <code>LinkToInstance(player)</code>.</li>
<li><code>static</code> locals as C++ Meyers singletons — not in the subset.</li>
</ul>`,
	);

	page(
		"modules",
		"modules.html",
		"Modules",
		"OOP",
		`<p class="muted">Untagged <code>.clp</code> / <code>.clh</code> become ModuleScripts. Tagged files become Scripts / LocalScripts that may <code>require</code> those modules.</p>
<h2>Header-only types</h2>
<p>A <code>.h</code> with structs and <code>const</code> values emits <code>export type</code> plus a constructor / bound constants, then <code>return</code>s the table. Prototypes become type fields; bodies are not emitted from the header.</p>
<h2>Sibling implementation</h2>
<p><code>Name.h</code> + <code>Name.cpp</code> (same stem, untagged) → <code>Name.luau</code> (types + re-exports) and <code>NameImpl.luau</code> (function bodies). The header binds those functions. The impl does not <code>require</code> its own header.</p>
<h2>Quoted include from another file</h2>
<p><code>#include "../../shared/PlayerData.h"</code> injects <code>require(ReplicatedStorage.Cluaupp...)</code> using Rojo. Own-header include (same stem as the <code>.cpp</code> being compiled) is inlined instead.</p>
<h2>Return rules</h2>
<table>
<tr><th>File</th><th>End of Luau</th></tr>
<tr><td>All functions are <code>Class::</code> methods</td><td><code>return Class</code> (ModuleScript)</td></tr>
<tr><td>Struct fields only, no methods</td><td>constructor + <code>return Name</code></td></tr>
<tr><td>Free functions + <code>void init()</code> on a tagged script</td><td><code>init()</code> call, no return</td></tr>
<tr><td>Free functions, no <code>init</code>, untagged</td><td>functions only — add an explicit return table if you need a module API</td></tr>
</table>
<p>Keep shared modules safe on both server and client. No DataStore writes in shared.</p>`,
	);

	page(
		"instances",
		"instances.html",
		"Instances",
		"Roblox",
		`${codePair(
	`Folder* existingFolder = player->FindFirstChild("leaderstats");
if (existingFolder) {
	return static_cast<Folder*>(existingFolder);
}

Folder* newFolder = new Folder(player);
newFolder->Name = "leaderstats";

IntValue* coinsValue = new IntValue(newFolder);
coinsValue->Name = "Coins";
coinsValue->Value = STARTING_COINS;`,
	`local existingFolder: Folder = player:FindFirstChild("leaderstats")
if existingFolder then
	return existingFolder
end

local newFolder: Folder = Instance.new("Folder")
newFolder.Parent = player
newFolder.Name = "leaderstats"

local coinsValue: IntValue = Instance.new("IntValue")
coinsValue.Parent = newFolder
coinsValue.Name = "Coins"
coinsValue.Value = STARTING_COINS`,
)}
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>new Folder(player)</code></td><td><code>Instance.new("Folder")</code> + <code>.Parent = player</code></td></tr>
<tr><td><code>new Folder()</code></td><td><code>Instance.new("Folder")</code> with no parent</td></tr>
<tr><td><code>new Janitor()</code></td><td><code>Janitor.new()</code> (library, not Instance)</td></tr>
<tr><td><code>part-&gt;Name</code></td><td><code>part.Name</code> (property)</td></tr>
<tr><td><code>player-&gt;FindFirstChild("x")</code></td><td><code>player:FindFirstChild("x")</code> (method)</td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>CFrame::lookAt(a, b)</code></td><td><code>CFrame.lookAt(a, b)</code></td></tr>
<tr><td><code>UDim2::fromScale(1, 1)</code></td><td><code>UDim2.fromScale(1, 1)</code></td></tr>
<tr><td><code>Color3::fromRGB(255, 0, 0)</code></td><td><code>Color3.fromRGB(255, 0, 0)</code></td></tr>
<tr><td><code>BrickColor("Bright red")</code></td><td><code>BrickColor.new("Bright red")</code></td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td><code>Enum.Material.Plastic</code></td></tr>
</table>
<p>The first argument of <code>new Class(parent)</code> becomes <code>.Parent</code> only for Roblox Instance classes. Datatypes use <code>Vector3(...)</code>, not <code>new</code>. Always test <code>FindFirstChild</code> before using the result. Official class list: <a href="https://create.roblox.com/docs/reference/engine/classes">create.roblox.com</a>.</p>`,
	);

	page(
		"events",
		"events.html",
		"Events and callbacks",
		"Roblox",
		`<p class="muted">Signals use <code>.Connect</code>. Callbacks may be named functions or lambdas. There is no <code>std::function</code> type in emit — a lambda is a Luau <code>function</code>. Full lambda lesson: <a href="lambdas.html">11. Lambdas</a>.</p>
${codePair(
	`players->PlayerAdded.Connect([&](Player* playerEntered) {
	leaderstatsServer.PlayerEntered(playerEntered);
});

playerData->GetChangedSignal(DataService::Server.Paths.Currencies.Coins).Connect(
	[coinsValue](int newValue) {
		if (coinsValue->Value != newValue) {
			coinsValue->Value = newValue;
		}
	}
);

game->BindToClose([&]() {
	leaderstatsServer.janitor->Cleanup();
});

players->PlayerAdded.Connect(OnPlayer);`,
	`players.PlayerAdded:Connect(function(playerEntered: Player)
	leaderstatsServer:PlayerEntered(playerEntered)
end)

playerData:GetChangedSignal(DataService.Server.Paths.Currencies.Coins):Connect(function(newValue: number)
	if coinsValue.Value ~= newValue then
		coinsValue.Value = newValue
	end
end)

game:BindToClose(function()
	leaderstatsServer.janitor:Cleanup()
end)

players.PlayerAdded:Connect(OnPlayer)`,
)}
<h2>Lambda forms</h2>
<table>
<tr><th>CL++</th><th>Meaning in this subset</th></tr>
<tr><td><code>[](Player* p) { … }</code></td><td>Accepted. Capture list is ignored in Luau (closures see enclosing locals).</td></tr>
<tr><td><code>[&amp;](Player* p) { … }</code></td><td>Same. Write <code>[&amp;]</code> when you use <code>init()</code> locals.</td></tr>
<tr><td><code>[=](Player* p) { … }</code></td><td>Same. Luau does not copy-capture like C++.</td></tr>
<tr><td><code>[coinsValue](int n) { … }</code></td><td>Same. Keep <code>coinsValue</code> alive with Janitor so it is not a dangling handle.</td></tr>
<tr><td><code>[]() { … }</code></td><td>No parameters.</td></tr>
</table>
<p>Parameters are typed the same way as functions. The body is a block of statements.</p>
<h2>Named functions vs methods</h2>
<p><code>Connect(OnPlayer)</code> passes the free function. <code>Connect(PlayerEntered)</code> inside a <code>Class::</code> method becomes <code>function(...) self:PlayerEntered(...) end</code> so <code>self</code> is bound. Prefer a lambda that calls the method when the callback needs extra locals (<code>coinsValue</code>, the service table).</p>
<h2>Janitor</h2>
<p>Every Connect that outlives a player, GUI, or tool needs a Janitor. <code>janitor-&gt;Add(conn, "Disconnect")</code> or <code>Add(instance, "Destroy", key)</code>. <code>BindToClose</code> should Cleanup the service janitor.</p>`,
	);

	page(
		"engine",
		"engine.html",
		"Roblox in Cluaupp",
		"Roblox",
		`<p class="muted">The engine API is the official Roblox one. Cluaupp only changes <em>how you spell the call</em>. Full member lists live on <a href="https://create.roblox.com/docs/reference/engine">create.roblox.com</a> — this site does not clone every Enum item.</p>
<h2>Services</h2>
${codePair(
	`Players* players = GetService<Players>();
ReplicatedStorage* rs = GetService<ReplicatedStorage>();`,
	`local players: Players = game:GetService("Players")
local rs: ReplicatedStorage = game:GetService("ReplicatedStorage")`,
)}
<h2>Datatypes</h2>
<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>Vector3(x, y, z)</code></td><td><code>Vector3.new(x, y, z)</code></td></tr>
<tr><td><code>CFrame::lookAt(from, look)</code></td><td><code>CFrame.lookAt(from, look)</code></td></tr>
<tr><td><code>UDim2::fromScale(1, 1)</code></td><td><code>UDim2.fromScale(1, 1)</code></td></tr>
<tr><td><code>Color3::fromRGB(255, 0, 0)</code></td><td><code>Color3.fromRGB(255, 0, 0)</code></td></tr>
<tr><td><code>BrickColor("Bright red")</code></td><td><code>BrickColor.new("Bright red")</code></td></tr>
</table>
<h2>Enums (one spelling)</h2>
${codePair(
	`part->Material = Enum::Material::Plastic;`,
	`part.Material = Enum.Material.Plastic`,
)}
<p>Every other enum is the same pattern: <code>Enum::Name::Item</code>. Look items up on Creator Hub, not here.</p>
<h2>Globals</h2>
<p><code>game</code>, <code>workspace</code>, <code>script</code>, <code>print</code>, <code>warn</code>, <code>error</code>, <code>tick</code>, <code>time</code>, <code>wait</code>, <code>spawn</code>, <code>delay</code>.</p>
<p>Instances and properties: <a href="instances.html">Instances</a>. Signals: <a href="events.html">Events</a>.</p>`,
	);

	page(
		"libraries",
		"libraries.html",
		"Libraries",
		"Roblox",
		`<p class="muted"><code>#include &lt;cluaupp/libs/…hpp&gt;</code> is IntelliSense. <code>cluaupp build</code> copies Luau into <code>ReplicatedStorage.CluauppLibs</code>. You do not <code>require</code> by hand.</p>
<h2>DataService — Template then Paths</h2>
<p>Do not put <code>Currencies</code> on the library type. Define the save struct and pass it as <code>.Template</code> <strong>once</strong> from a boot script. Leaderstats / HUD only <code>WaitFor</code>.</p>
${codePair(
	`PlayerData playerData = PlayerData {};
DataService::Server.Init(DataServiceOptions {
	.Template = playerData,
	.StoreName = "PlayerData",
	.UseMock = true,
});

Data* data = DataService::Server.WaitFor(player);
int coins = data->Get(DataService::Server.Paths.Currencies.Coins);
data->Set(DataService::Server.Paths.Currencies.Coins, coins + 1);
data->GetChangedSignal(DataService::Server.Paths.Currencies.Coins).Connect(OnCoins);`,
	`local playerData = PlayerData()
DataService.Server:Init({
	Template = playerData,
	StoreName = "PlayerData",
	UseMock = true,
})

local data = DataService.Server:WaitFor(player)
local coins = data:Get(DataService.Server.Paths.Currencies.Coins)
data:Set(DataService.Server.Paths.Currencies.Coins, coins + 1)
data:GetChangedSignal(DataService.Server.Paths.Currencies.Coins):Connect(OnCoins)`,
)}
<p class="note"><code>Paths.Currencies.Coins</code> exists because <em>your</em> Template had that field. A local <code>PlayerDataCurrencies currencies; currencies.Coins</code> is an <code>int</code>, not a path.</p>
<p>Client: <code>DataService::Client.Init()</code> once, then <code>WaitForData()</code>. Writes that persist belong on the server. <code>SetTransient</code> is session-only.</p>
<h2>Janitor</h2>
${codePair(
	`janitor->Add(leaderstatsFolder, "Destroy", GetPlayerJanitorKey(player));
janitor->Add(conn, "Disconnect");
janitor->LinkToInstance(player);
janitor->Cleanup();
janitor->Destroy();`,
	`janitor:Add(leaderstatsFolder, "Destroy", GetPlayerJanitorKey(player))
janitor:Add(conn, "Disconnect")
janitor:LinkToInstance(player)
janitor:Cleanup()
janitor:Destroy()`,
)}
<p>No fake <code>Has</code>. <code>Get</code> a key; <code>Remove</code> on a missing index is a no-op. Do not install a second Janitor from Wally.</p>
<h2>Net / Promise / numbers / 3D</h2>
<table>
<tr><th>Include</th><th>Call</th></tr>
<tr><td><code>net.clh</code></td><td><code>Net::Event("Coins")</code>, <code>Fire</code> / <code>FireServer</code> / <code>OnServer</code></td></tr>
<tr><td><code>promise.clh</code></td><td><code>Promise</code> Then / Catch / Await / Delay</td></tr>
<tr><td><code>formatnumber.clh</code></td><td><code>FormatNumber::Abbreviate(1500)</code></td></tr>
<tr><td><code>math.hpp</code></td><td><code>MathUtils::Lerp(a, b, t)</code></td></tr>
<tr><td><code>module3d.clh</code></td><td><code>Module3D::Attach3D(frame, model)</code> (colon)</td></tr>
<tr><td><code>twinkle.clh</code></td><td><code>Twinkle::Fade(frame, true)</code></td></tr>
</table>
<p>Also shipped: Fusion, Iris, Cmdr, Chrono, TopbarPlus, Spring, Display, EzVisualz, StateMachine, VfxUtil, StickyBillboard, ArrayIndexer, Occlude. Declarative UI: <a href="ui.html">Fusion, Iris, Vide, React</a>.</p>
<p>Wally is optional and only for packages <em>not</em> in CluauppLibs.</p>`,
	);

	page(
		"ui",
		"ui.html",
		"Declarative UI",
		"Roblox",
		uiPageInner({ codePair, preCode }),
	);

	page(
		"optimization",
		"optimization.html",
		"Optimization",
		"Practice",
		`<p class="muted">Observations that stay true after compile. Luau is what Studio runs; Cluaupp will not invent a faster algorithm for you.</p>
<h2>Initialize and const</h2>
<ul>
<li>Always initialize. <code>int coins;</code> emits <code>nil</code>.</li>
<li><code>const</code> remote names, product IDs, starting values. Mutable player numbers stay <code>local</code>.</li>
<li>Do not recompute the same <code>GetService</code> / <code>FindFirstChild</code> inside <code>RenderStepped</code>. Cache in <code>init()</code> or on the struct.</li>
</ul>
<h2>Instances</h2>
<ul>
<li>Prefer <code>FindFirstChild</code> plus an early return over <code>WaitForChild</code> on hot paths. Wait can hang forever.</li>
<li>Test <code>nullptr</code> once, then use the handle.</li>
<li><code>static_cast</code> is free (it disappears). It is not a ClassName check.</li>
</ul>
<h2>Janitor lifetime</h2>
<ul>
<li>Janitor <code>Cleanup</code> is O(tracked objects). One global janitor for the whole server is a hitch on shutdown.</li>
<li>Key per player (<code>string_concat(player-&gt;Name, "_LeaderstatsJanitor")</code>) or <code>LinkToInstance(player)</code>.</li>
<li>Leaked connections duplicate effects: double coins, stacked cameras.</li>
</ul>
<h2>Net and data</h2>
<ul>
<li>Net already uses <code>buffer</code>. Do not JSONEncode a whole inventory every heartbeat. Send deltas. Cap array lengths the client can send.</li>
<li>Only the server writes persisted DataService paths. <code>SetTransient</code> for overlays that must not save.</li>
<li>Batch <code>Fire</code> when you can. Do not fire per-heartbeat for every NPC.</li>
</ul>
<h2>Strings</h2>
<ul>
<li><code>string_concat(a, b, c)</code> is one join. Many <code>+</code> of non-string pieces stay arithmetic and are wrong.</li>
<li>Remote names are public protocol. Changing a name without a migration breaks old clients — keep them <code>const</code>.</li>
</ul>
<h2>Files and emit</h2>
<ul>
<li>One system per file. Smaller modules compile and replicate less.</li>
<li>Default 1:1 emit is cheaper than <code>"architecture": true</code> (no invented Main / Types trees).</li>
<li>Do not edit <code>out/</code>. Watch skips rewriting Luau whose contents did not change (a space in C++ no longer floods Rojo).</li>
<li>Module3D is a ViewportFrame — shops and inventory, not cloning the whole map.</li>
</ul>
<h2>Good C++ conduct that still applies</h2>
<ol>
<li>Small functions named after the behavior.</li>
<li>No magic numbers — <code>static constexpr int MAX_INVENTORY = 20</code>.</li>
<li>Early return. Flatten <code>if</code> pyramids.</li>
<li>Headers declare, scripts define.</li>
<li>Do not share mutable file-scope state across server and client.</li>
</ol>`,
	);

	page(
		"safety",
		"safety.html",
		"Safety",
		"Practice",
		`<p class="muted">Safety is habits the compiler and libraries make cheap — not a sandbox flag.</p>
<h2>Never trust the client</h2>
<p>Net lets a client FireServer. The server validates intent (<code>productId</code>), not a new coin total the client invented. Only the server writes persisted DataService paths.</p>
${codePair(
	`void OnBuy(Player* player, int productId) {
	if (productId < 1) {
		return;
	}
	int price = PriceOf(productId);
	Data* data = DataService::Server.WaitFor(player);
	if (data == nullptr) {
		return;
	}
	int coins = data->Get(DataService::Server.Paths.Currencies.Coins);
	if (coins < price) {
		return;
	}
	data->Set(DataService::Server.Paths.Currencies.Coins, coins - price);
}`,
	`const function OnBuy(player: Player, productId: number)
	if productId < 1 then
		return
	end
	local price: number = PriceOf(productId)
	local data = DataService.Server:WaitFor(player)
	if data == nil then
		return
	end
	local coins = data:Get(DataService.Server.Paths.Currencies.Coins)
	if coins < price then
		return
	end
	data:Set(DataService.Server.Paths.Currencies.Coins, coins - price)
end`,
)}
<h2>nil, Janitor, one writer</h2>
<ul>
<li><code>FindFirstChild</code> returns <code>nullptr</code>. Check before use.</li>
<li>Every Connect that can outlive its owner goes in a Janitor.</li>
<li>One writer for persisted data. <code>GetPersisted</code> vs merged <code>Get</code>. <code>SetTransient</code> for cheats that must not save.</li>
<li>Remote names are API. Keep them <code>const</code>, short, unique.</li>
</ul>`,
	);

	page(
		"architecture",
		"architecture.html",
		"Architecture",
		"Practice",
		`<p class="muted">Filename tags decide Script / LocalScript / ModuleScript. Cluaupp stops there by default. It does not invent Main / Controller / Types folders.</p>
<p><strong>SystemUnderstander</strong> scans Tree-sitter identifiers (no generative AI). Token density scores intents (combat, ui, net, data, players). Score under 2 → utility Module. Otherwise it stamps a Knit-style role (<code>CombatController</code>, <code>ViewController</code>) and may inject <code>GetService</code>. The Rojo class never changes because of that role.</p>
${preCode(`filename key     →  Script | LocalScript | ModuleScript
SystemUnderstander →  role + GetService inject (comments)
opt-in architecture: true → Main / Managers / Controllers / Types`, "plain")}
<p>Set <code>"architecture": true</code> only if you want the old ForeverHD planner: PascalCase folders, <code>Main.Start</code> / <code>Stop</code>, Managers, Controllers, Types. Server folders then emit <code>init.server.luau</code> plus a pure JSON <code>init.meta.json</code> with only <code>RunContext.Server</code>.</p>
<p>Compiler pipeline: collect symbols → emit Luau in order Services → Requires → Types → Constants → Code. StyLua / <code>luau-analyze</code> are opt-in on project build (<code>--format</code> / <code>--analyze</code>).</p>
<p>Tags: <a href="files.html">File tags</a>. Config: <a href="config.html">Config</a>.</p>`,
	);

	page(
		"leaderstats",
		"leaderstats.html",
		"Example: Leaderstats",
		"Examples",
		`<p class="muted">Three files. Header stem matches the <code>.server.clpp</code>. Coins come from DataService Paths after a separate boot <code>Init</code>.</p>
<h2>shared/PlayerData.h</h2>
${preCode(`#pragma once
#include <clpp/datatypes.clh>

struct PlayerDataCurrencies {
	int Coins = 0;
	int Rebirths = 0;
};

struct PlayerDataInventory {
	LuaArray<int> HotBar;
	LuaArray<string> Storage;
	int MaxStorage = 90;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
	PlayerDataInventory Inventory;
};`, "cpp")}
<h2>server/LeaderstatsServer.h</h2>
${preCode(`#pragma once
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>
#include <clpp/libs/dataservice.clh>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;
	Janitor* janitor;
	string GetPlayerJanitorKey(Player* player);
	void UpdateLeaderstatsWithValues(IntValue* currentValue, int newValue);
	Folder* EnsurePlayerLeaderstatsFolder(Player* player);
	void PlayerEntered(Player* player);
};`, "cpp")}
<h2>server/LeaderstatsServer.server.clpp</h2>
${preCode(`#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>
#include <clpp/libs/janitor.clh>
#include "LeaderstatsServer.h"
#include "../../shared/PlayerData.h"

string LeaderstatsServer::GetPlayerJanitorKey(Player* player) {
	return string_concat(player->Name, "_LeaderstatsJanitor");
}

void LeaderstatsServer::UpdateLeaderstatsWithValues(IntValue* currentValue, int newValue) {
	if (currentValue->Value != newValue) {
		currentValue->Value = newValue;
	}
}

Folder* LeaderstatsServer::EnsurePlayerLeaderstatsFolder(Player* player) {
	Instance* existingFolder = player->FindFirstChild("leaderstats");
	if (existingFolder) {
		return static_cast<Folder*>(existingFolder);
	}
	Folder* newFolder = new Folder(player);
	newFolder->Name = "leaderstats";
	IntValue* coinsValue = new IntValue(newFolder);
	coinsValue->Name = "Coins";
	coinsValue->Value = STARTING_COINS;
	return newFolder;
}

void LeaderstatsServer::PlayerEntered(Player* player) {
	Folder* leaderstatsFolder = EnsurePlayerLeaderstatsFolder(player);
	Data* playerData = DataService::Server.WaitFor(player);
	IntValue* coinsValue = static_cast<IntValue*>(leaderstatsFolder->FindFirstChild("Coins"));
	if (coinsValue) {
		playerData->GetChangedSignal(DataService::Server.Paths.Currencies.Coins).Connect(
			[coinsValue](int newValue) {
				UpdateLeaderstatsWithValues(coinsValue, newValue);
			}
		);
	}
	janitor->Add(leaderstatsFolder, "Destroy", GetPlayerJanitorKey(player));
}

void init() {
	Players* players = GetService<Players>();
	LeaderstatsServer leaderstatsServer;
	leaderstatsServer.janitor = new Janitor();
	for (Player* player : players->GetPlayers()) {
		leaderstatsServer.PlayerEntered(player);
	}
	leaderstatsServer.janitor->Add(
		players->PlayerAdded.Connect([&](Player* playerEntered) {
			leaderstatsServer.PlayerEntered(playerEntered);
		}),
		"Disconnect"
	);
	game->BindToClose([&]() {
		leaderstatsServer.janitor->Cleanup();
		leaderstatsServer.janitor->Destroy();
	});
}`, "cpp")}
<p>Call <code>DataService::Server.Init</code> in <code>DataBoot.server.clpp</code> with <code>PlayerData {}</code>. This file never calls <code>Init</code> again.</p>
<p>This example uses: sibling headers, <code>Class::</code> methods, <code>string_concat</code>, <code>static_cast</code>, lambdas, range-<code>for</code>, a service singleton in <code>init()</code>, Janitor keys, and DataService Paths.</p>`,
	);

	registerLuauLesson(page, { codePair, preCode, escapeHtml, mappingTable });

	return pages;
}

const CPP_CLASS_ORDER = [
	"syntax",
	"logging",
	"comments",
	"variables",
	"types",
	"operators",
	"strings",
	"booleans",
	"control",
	"functions",
	"lambdas",
	"scopes",
	"structs",
	"luau",
];

export function groupDocs(pages: DocsPage[]) {
	const groups: { name: string; items: DocsPage[] }[] = [];
	for (const page of pages) {
		let group = groups.find((item) => item.name === page.group);
		if (!group) {
			group = { name: page.group, items: [] };
			groups.push(group);
		}
		group.items.push(page);
	}
	for (const group of groups) {
		if (group.name !== "CL++ class") {
			continue;
		}
		group.items.sort((a, b) => {
			const ia = CPP_CLASS_ORDER.indexOf(a.id);
			const ib = CPP_CLASS_ORDER.indexOf(b.id);
			return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
		});
	}
	return groups;
}
