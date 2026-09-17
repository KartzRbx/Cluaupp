import type { PageHelpers } from "../lib/types";

type PageFn = (id: string, file: string, title: string, group: string, inner: string) => void;

const GROUP = "C++ class";

export function registerCppLessons(page: PageFn, { codePair, preCode }: PageHelpers) {
	page(
		"syntax",
		"syntax.html",
		"1. Syntax",
		GROUP,
		`<p class="muted">Read this like a first C++ class. Same idea as the <a href="https://www.w3schools.com/CPP/cpp_syntax.asp">W3Schools C++ Syntax</a> chapter — statements, braces, semicolons — but the program shape is Cluaupp, not <code>int main()</code>.</p>
<p>Let’s break up this file:</p>
${codePair(
	`#include <cluaupp/roblox.hpp>

void init() {
	print("Hello World!");
}`,
	`const function init()
	print("Hello World!")
end

init()`,
)}
<h2>Example explained</h2>
<ol>
<li><code>#include &lt;cluaupp/roblox.hpp&gt;</code> is the header clangd reads. It is <em>not</em> <code>#include &lt;iostream&gt;</code>. There is no <code>using namespace std;</code> — Cluaupp skips <code>using</code> and does not emit the C++ standard library.</li>
<li>Blank lines are ignored. Use them so a human can read the file.</li>
<li><code>void init()</code> is the function that runs. In a textbook, that role is <code>int main()</code>. Scripts and LocalScripts call <code>init()</code> at the end of the emitted Luau. There is no <code>return 0;</code>.</li>
<li>Curly braces <code>{ }</code> open and close a block. Luau uses <code>then</code> / <code>do</code> / <code>end</code> instead — Cluaupp writes those for you.</li>
<li><code>print("Hello World!");</code> is a statement. Every statement ends with a semicolon <code>;</code>. C++ is case-sensitive: <code>print</code> and <code>Print</code> are different names.</li>
</ol>
<p class="note">W3Schools starts with <code>cout &lt;&lt; "Hello World!";</code>. That works here too (next lesson), but <code>print</code> is the Roblox spelling and maps 1:1 to Luau.</p>
<h2>Put it in a real file</h2>
<p>Save as <code>src/server/Hello.server.cpp</code> (a Script) or <code>src/client/Hello.client.cpp</code> (a LocalScript). Filename tags: <a href="files.html">File tags</a>.</p>
${preCode(`src/server/Hello.server.cpp   →  out/server/Hello.server.luau
src/client/Hello.client.cpp   →  out/client/Hello.client.luau`, "plain")}
<h2>What this chapter is not</h2>
<ul>
<li>Not ISO C++. No <code>std::</code>, no <code>int main()</code> as the boot, no macros.</li>
<li>Not a second language runtime. Cluaupp only <em>emits</em> Luau. Studio runs Luau.</li>
</ul>
<p>Next: <a href="logging.html">2. Output</a> — <code>print</code> and <code>cout</code>.</p>`,
	);

	page(
		"comments",
		"comments.html",
		"3. Comments",
		GROUP,
		`<p class="muted">Comments are notes for you. The compiler throws them away. They never appear in the <code>.luau</code> file.</p>
<h2>Line comments</h2>
${codePair(
	`// Starting coins for a new player.
const int STARTING_COINS = 0;
int coins = STARTING_COINS; // also fine at the end of a line`,
	`const STARTING_COINS: number = 0
local coins: number = STARTING_COINS`,
)}
<h2>Block comments</h2>
${codePair(
	`/*
	Give coins on join.
	Server only.
*/
void Give(Player* player) {
	print(player->Name);
}`,
	`const function Give(player: Player)
	print(player.Name)
end`,
)}
<p>There is no <code>///</code> doc emit and no Luau <code>--</code> inside a <code>.cpp</code>. Write C++ comments; Cluaupp strips them in the lexer.</p>
<p>Next: <a href="variables.html">4. Variables</a>.</p>`,
	);

	page(
		"variables",
		"variables.html",
		"4. Variables",
		GROUP,
		`<p class="muted">A variable is a named box. You pick a type, a name, and (in this subset) a value. Same lesson as <a href="https://www.w3schools.com/CPP/cpp_variables.asp">W3Schools C++ Variables</a>, with Cluaupp rules on top.</p>
<h2>Declare and assign</h2>
${codePair(
	`int coins = 10;
coins = 11;`,
	`local coins: number = 10
coins = 11`,
)}
<p>Always initialize. <code>int coins;</code> with no value emits <code>nil</code>, which surprises you later.</p>
<h2>Identifiers</h2>
<ul>
<li>Letters, digits, <code>_</code>. Must not start with a digit.</li>
<li>Case-sensitive: <code>Coins</code> and <code>coins</code> are two variables.</li>
<li>No spaces. Prefer <code>startingCoins</code> or <code>StartingCoins</code>, not <code>starting coins</code>.</li>
</ul>
<h2>Multiple variables</h2>
<p>Write one declaration per statement. There is no <code>int x = 1, y = 2;</code> emit you should rely on — two lines is the class style:</p>
${codePair(
	`int x = 1;
int y = 2;`,
	`local x: number = 1
local y: number = 2`,
)}
<h2>const</h2>
<p>A value that must not be reassigned. Remote names, product IDs, starting coins:</p>
${codePair(
	`const int STARTING_COINS = 0;
const string SHOP_EVENT = "Shop";`,
	`const STARTING_COINS: number = 0
const SHOP_EVENT: string = "Shop"`,
)}
<p>Luau <code>const</code> is what you get. Player-owned numbers stay mutable <code>local</code>.</p>
<h2>There is no cin</h2>
<p>W3Schools teaches <code>cin &gt;&gt; x</code> for keyboard input. Roblox has no stdin. Input is <code>UserInputService</code>, TextBox, or a Remote — on the <a href="files.html">client</a>.</p>
<p>Next: <a href="types.html">5. Data types</a>.</p>`,
	);

	page(
		"booleans",
		"booleans.html",
		"8. Booleans",
		GROUP,
		`<p class="muted">A boolean is <code>true</code> or <code>false</code>. You use it in <code>if</code> and <code>while</code>.</p>
${codePair(
	`bool ready = true;
bool empty = coins == 0;
if (!ready) {
	return;
}`,
	`local ready: boolean = true
local empty: boolean = coins == 0
if not ready then
	return
end`,
)}
<h2>From expressions</h2>
<table>
<tr><th>C++</th><th>Luau</th><th>Meaning</th></tr>
<tr><td><code>==</code> <code>!=</code></td><td><code>==</code> <code>~=</code></td><td>equal / not equal</td></tr>
<tr><td><code>&amp;&amp;</code> <code>||</code> <code>!</code></td><td><code>and</code> <code>or</code> <code>not</code></td><td>and / or / not</td></tr>
<tr><td><code>nullptr</code></td><td><code>nil</code></td><td>missing Instance — falsy in <code>if (folder)</code></td></tr>
</table>
<p>After <code>FindFirstChild</code>, test the pointer:</p>
${codePair(
	`Folder* folder = static_cast<Folder*>(player->FindFirstChild("leaderstats"));
if (folder) {
	print(folder->Name);
}`,
	`local folder: Folder = player:FindFirstChild("leaderstats")
if folder then
	print(folder.Name)
end`,
)}
<p>Next: <a href="control-flow.html">9. If, while, for</a>.</p>`,
	);

	page(
		"lambdas",
		"lambdas.html",
		"11. Lambdas",
		GROUP,
		`<p class="muted">A lambda is a mini function you write in place — the same idea as the <a href="https://www.w3schools.com/CPP/cpp_functions_lambda.asp">W3Schools C++ Lambda</a> chapter. Cluaupp emits a Luau <code>function</code>. There is no <code>std::function</code> and no <code>&lt;functional&gt;</code>.</p>
<h2>Syntax</h2>
${preCode(`[capture](parameters) { body }`, "plain")}
<p>For a first example, use empty capture <code>[]</code>:</p>
${codePair(
	`auto message = []() {
	print("Hello World!");
};
message();`,
	`local message = function()
	print("Hello World!")
end
message()`,
)}
<h2>Parameters</h2>
<p>Pass values like a regular function:</p>
${codePair(
	`auto add = [](int a, int b) {
	return a + b;
};
print(add(3, 4));`,
	`local add = function(a: number, b: number)
	return a + b
end
print(add(3, 4))`,
)}
<h2>Pass a lambda to Connect</h2>
<p>This is the usual Roblox use. You tell a signal what to do, not just what data to use:</p>
${codePair(
	`players->PlayerAdded.Connect([](Player* player) {
	print(player->Name);
});`,
	`players.PlayerAdded:Connect(function(player: Player)
	print(player.Name)
end)`,
)}
<h2>Capture []</h2>
<p>W3Schools: <code>[x]</code> copies, <code>[&amp;x]</code> / <code>[&amp;]</code> sees the original. Cluaupp accepts <code>[]</code>, <code>[=]</code>, <code>[&amp;]</code>, and named lists. Luau closures always see the outer locals — there is no separate copy vs reference machine. Write <code>[&amp;]</code> when the callback must use a struct you built in <code>init()</code>:</p>
${codePair(
	`void init() {
	LeaderstatsServer leaderstatsServer;
	leaderstatsServer.janitor = new Janitor();
	Players* players = GetService<Players>();
	players->PlayerAdded.Connect([&](Player* playerEntered) {
		leaderstatsServer.PlayerEntered(playerEntered);
	});
}`,
	`const function init()
	local leaderstatsServer: LeaderstatsServer = LeaderstatsServer
	leaderstatsServer.janitor = Janitor.new()
	local players: Players = game:GetService("Players")
	players.PlayerAdded:Connect(function(playerEntered: Player)
		leaderstatsServer:PlayerEntered(playerEntered)
	end)
end`,
)}
<h2>Regular function vs lambda</h2>
<table>
<tr><th>Use a named function when…</th><th>Use a lambda when…</th></tr>
<tr><td>You call it from more than one place</td><td>You need it once (almost always <code>Connect</code>)</td></tr>
<tr><td>The body is long</td><td>The body is a few statements</td></tr>
<tr><td>You want a clear name in the stack trace</td><td>The work is “on this signal”</td></tr>
</table>
${codePair(
	`int Add(int a, int b) {
	return a + b;
}

auto add = [](int a, int b) {
	return a + b;
};`,
	`const function Add(a: number, b: number): number
	return a + b
end

local add = function(a: number, b: number)
	return a + b
end`,
)}
<p>Named functions: <a href="functions.html">10. Functions</a>. Signals: <a href="events.html">Events</a>.</p>`,
	);
}

export function registerLuauLesson(page: PageFn, { codePair, preCode }: PageHelpers) {
	page(
		"luau",
		"luau.html",
		"14. The Luau you emit",
		GROUP,
		`<p class="muted">Cluaupp’s output is <a href="https://luau.org/getting-started/">Luau</a> — a small, gradually typed language derived from Lua 5.1. Studio runs that file. You do not edit <code>out/</code>.</p>
<h2>Creating a script</h2>
<p>The Luau tutorial starts with a <code>.luau</code> file you type by hand. In Cluaupp you type <code>.cpp</code>; <code>cluaupp build</code> writes the <code>.luau</code>.</p>
${codePair(
	`bool IsPositive(int x) {
	return x > 0;
}

void init() {
	print(IsPositive(1));
	print(IsPositive(-1));
}`,
	`const function IsPositive(x: number): boolean
	return x > 0
end

const function init()
	print(IsPositive(1))
	print(IsPositive(-1))
end

init()`,
)}
<p>Run the game through Rojo / Studio, not the <code>luau</code> CLI (unless you are analyzing a single emitted file).</p>
<h2>Type checking</h2>
<p>Luau defaults to <em>nonstrict</em>: it only reports errors when it is sure the program will fail at runtime. <em>Strict</em> reports errors when the program <em>might</em> fail.</p>
<p>Turn strict on for a file:</p>
${preCode(`#pragma strict`, "cpp")}
<p>Or for the whole game: <code>cluaupp.config.json</code> <code>"strict": true</code>, or <code>cluaupp build --strict</code> on the single-file path. <code>#pragma nstrict</code> always wins.</p>
<p>That prefix is <code>--!strict</code> at the top of the Luau — the same flag the <a href="https://luau.org/getting-started/">Luau getting started</a> chapter adds by hand.</p>
${preCode(`--!strict
const function IsPositive(x: number): boolean
	return x > 0
end`, "luau")}
<p><code>cluaupp build --analyze</code> runs <code>luau-analyze</code> on what you emitted.</p>
<h2>Annotations</h2>
<p>Luau lets you annotate locals, arguments, and return types. Cluaupp already did that from your C++ types:</p>
<table>
<tr><th>You wrote (C++)</th><th>Luau annotation</th></tr>
<tr><td><code>int x</code></td><td><code>x: number</code></td></tr>
<tr><td><code>bool ready</code></td><td><code>ready: boolean</code></td></tr>
<tr><td><code>string name</code></td><td><code>name: string</code></td></tr>
<tr><td><code>Player* player</code></td><td><code>player: Player</code></td></tr>
<tr><td><code>int Double(int n)</code></td><td><code>function Double(n: number): number</code></td></tr>
</table>
<p>If you later change a C++ return type and forget a call site, <code>luau-analyze</code> in strict mode flags the mismatch — the same “oops, we return a string now” story as the Luau tutorial.</p>
<p>C++ types are the source of truth. Do not sprinkle Luau <code>:</code> annotations inside a <code>.cpp</code>.</p>
<h2>Conclusions</h2>
<p>You learned the subset the way a C++ class is taught, then saw the Luau it becomes. Keep <a href="reference.html">Language reference</a> open while you write. Official Luau: <a href="https://luau.org/getting-started/">luau.org/getting-started</a>. Official engine members: <a href="https://create.roblox.com/docs/reference/engine">Creator Hub</a>.</p>`,
	);
}
