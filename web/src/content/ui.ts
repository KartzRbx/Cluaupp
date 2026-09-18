import type { PageHelpers } from "../lib/types";

export function uiPageInner({ codePair, preCode }: Pick<PageHelpers, "codePair" | "preCode">) {
	return `<p class="muted">roblox-ts can compile <a href="https://roblox-ts.com/docs/guides/roact-jsx">Roact JSX</a> because TypeScript has JSX. Cluaupp does <strong>not</strong>. There are no <code>&lt;frame /&gt;</code> tags. You call the library the way Luau does, with CL++ spelling: functions, designated-initializer tables, <code>func [](…)</code> callbacks.</p>

<h2>Pick a model</h2>
<p>All of these draw Roblox GuiObjects. They differ in <em>who updates the tree</em>.</p>
<table>
<tr><th>When you want…</th><th>Use</th><th>In Cluaupp</th></tr>
<tr><td>A few labels you set by hand</td><td>Imperative Instances</td><td><code>new TextLabel(gui); label.Text = ...</code> — always valid</td></tr>
<tr><td>UI that follows state (coins, shop, inventory)</td><td><a href="https://github.com/dphfox/Fusion">Fusion</a></td><td>Shipped. <code>#include &lt;clpp/libs/fusion.clh&gt;</code></td></tr>
<tr><td>The same idea, finer-grained sources</td><td><a href="https://github.com/centau/vide">Vide</a></td><td>Not shipped. Calling convention below — add the Luau package yourself</td></tr>
<tr><td>A virtual tree (components, keys, reconcilers)</td><td>Roact / <a href="https://github.com/jsdotlua/react">jsdotlua React</a></td><td>Not shipped. <code>createElement</code>, never JSX</td></tr>
<tr><td>Studio / admin debug panels</td><td><a href="https://github.com/SirMallard/Iris">Iris</a></td><td>Shipped. Immediate-mode, not a player HUD</td></tr>
<tr><td>Topbar buttons, fade/zoom, rainbow strokes</td><td>TopbarPlus, Twinkle, EzVisualz</td><td>Shipped. They polish Instances you already have</td></tr>
</table>
<p class="note">Fusion and Iris are in CluauppLibs. Vide and React/Roact are <strong>not</strong> vendored — the examples show how you would call them in this subset once the module is in your Rojo tree.</p>

<h2>What JSX becomes</h2>
<p>Read this table once. Every later React example is the right-hand column.</p>
<table>
<tr><th>roblox-ts JSX</th><th>Cluaupp / Luau</th></tr>
<tr><td><code>&lt;frame Size={u} /&gt;</code></td><td><code>React:createElement("Frame", { .Size = u })</code></td></tr>
<tr><td><code>&lt;textlabel Key="Coins" /&gt;</code></td><td><code>.Key = "Coins"</code> on the props table</td></tr>
<tr><td><code>&lt;frame Ref={ref} /&gt;</code></td><td><code>.Ref = ref</code></td></tr>
<tr><td><code>Change={{ Position: fn }}</code></td><td><code>.Change = { .Position = fn }</code> (a nested table, not XML)</td></tr>
<tr><td><code>Event={{ Activated: fn }}</code></td><td><code>.Event = { .Activated = fn }</code></td></tr>
<tr><td>child tags</td><td>extra arguments to <code>createElement</code>, or a children table</td></tr>
<tr><td><code>&lt;MyButton text="Buy" /&gt;</code></td><td><code>React:createElement(MyButton, { .text = "Buy" })</code> — PascalCase function</td></tr>
<tr><td><code>&lt;&gt;...&lt;/&gt;</code></td><td><code>React:createElement(React:Fragment, {}, childA, childB)</code></td></tr>
</table>
<p>Fusion and Vide never had JSX. Their Luau APIs already look like the Cluaupp calls.</p>

<h2>1. Imperative HUD (no library)</h2>
<p>Start here if the screen is three labels. State still comes from DataService; you assign properties.</p>
${codePair(
	`#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>
#include <clpp/libs/janitor.clh>

TextLabel* coinsLabel;

void OnCoinsChanged(int newValue) {
	coinsLabel.Text = string_concat("Coins: ", newValue);
}

void init() {
	Players* players = GetService<Players>();
	PlayerGui* playerGui = players.LocalPlayer::WaitForChild("PlayerGui");
	ScreenGui* gui = new ScreenGui(playerGui);
	gui.Name = "Hud";

	coinsLabel = new TextLabel(gui);
	coinsLabel.Name = "Coins";
	coinsLabel.Size = UDim2:fromScale(1, 0.08);
	coinsLabel.BackgroundTransparency = 1;
	coinsLabel.TextScaled = true;

	Janitor* janitor = new Janitor();
	Data* data = DataService:Client::WaitForData();
	if (data == null) {
		return;
	}
	OnCoinsChanged(data::Get(DataService:Client.Paths.Currencies.Coins));
	janitor::Add(data::GetChangedSignal(DataService:Client.Paths.Currencies.Coins)::Connect(OnCoinsChanged));
}`,
	`local coinsLabel: TextLabel

const function OnCoinsChanged(newValue: number)
	coinsLabel.Text = "Coins: " .. newValue
end`,
)}
<p>When the tree grows (lists, hover, computed text), switch to Fusion or Vide so you stop writing every assignment by hand.</p>

<h2>2. Fusion — reactive, shipped</h2>
<p>Include <code>&lt;clpp/libs/fusion.clh&gt;</code>. A <code>Fusion:Value</code> is state. <code>Fusion:New("ClassName")</code> builds an Instance. Props are a designated-initializer table. There is no <code>&lt;textlabel /&gt;</code>.</p>

<h3>Value + a label</h3>
${codePair(
	`#include <clpp/roblox.clh>
#include <clpp/libs/fusion.clh>

void init() {
	PlayerGui* playerGui = GetService<Players>().LocalPlayer::WaitForChild("PlayerGui");
	ScreenGui* gui = new ScreenGui(playerGui);
	gui.Name = "CoinsHud";

	FusionScope scope = Fusion:scoped();
	FusionState coins = Fusion:Value(0);

	Fusion:New("TextLabel")({
		.Name = "Coins",
		.Parent = gui,
		.Size = UDim2:fromScale(1, 0.1),
		.BackgroundTransparency = 1,
		.TextScaled = true,
	});
}`,
	`local Fusion = require(ReplicatedStorage.CluauppLibs.Fusion)

const function init()
	local scope = Fusion.scoped()
	local coins = Fusion.Value(0)
	Fusion.New("TextLabel")({
		Name = "Coins",
		Parent = gui,
		Size = UDim2.fromScale(1, 0.1),
		BackgroundTransparency = 1,
		TextScaled = true,
	})
end`,
)}

<h3>Follow DataService</h3>
<p>Write the Fusion value from <code>GetChangedSignal</code>. Paths exist after your Template <code>Init</code>.</p>
${codePair(
	`FusionState coins = Fusion:Value(0);
Data* data = DataService:Client::WaitForData();
if (data) {
	coins = Fusion:Value(data::Get(DataService:Client.Paths.Currencies.Coins));
	data::GetChangedSignal(DataService:Client.Paths.Currencies.Coins)::Connect(
		func [](int newValue) {
			coins(newValue);
		}
	);
}`,
	`local coins = Fusion.Value(0)
local data = DataService.Client:WaitForData()
if data then
	coins = Fusion.Value(data:Get(DataService.Client.Paths.Currencies.Coins))
	data:GetChangedSignal(DataService.Client.Paths.Currencies.Coins):Connect(function(newValue: number)
		coins(newValue)
	end)
end`,
)}

<h3>Computed text</h3>
<p><code>Fusion:Computed</code> re-runs when the values it reads change. Use it for strings you would otherwise concatenate in five places.</p>
${codePair(
	`FusionState coins = Fusion:Value(10);
FusionState label = Fusion:Computed(func []() {
	return string_concat("Coins: ", Fusion:peek(coins));
});`,
	`local coins = Fusion.Value(10)
local label = Fusion.Computed(function()
	return "Coins: " .. Fusion.peek(coins)
end)`,
)}

<h3>Button that writes (still client-safe)</h3>
<p>The click lives on the client. The <code>Set</code> that persists belongs on the server via Net. Here the button only fires a remote.</p>
${codePair(
	`#include <clpp/libs/fusion.clh>
#include <clpp/libs/net.clh>

void init() {
	NetEvent* buy = Net:Event("Buy");
	Fusion:New("TextButton")({
		.Name = "Buy",
		.Size = UDim2:fromOffset(160, 40),
		.Text = "Buy",
	});
}`,
	`local buy = Net.Event("Buy")
Fusion.New("TextButton")({
	Name = "Buy",
	Size = UDim2.fromOffset(160, 40),
	Text = "Buy",
})`,
)}
<p>Connect <code>Activated</code> with a lambda the same way as any Instance: after you have the button (or with Fusion <code>OnEvent("Activated")</code> in the props table if you pass that key).</p>

<h3>Hydrate an existing ScreenGui</h3>
<p>If Studio already has a <code>Hud</code> with a <code>Coins</code> label, do not <code>New</code> a second tree. Hydrate the Instance you cloned or found.</p>
${codePair(
	`ScreenGui* gui = playerGui::WaitForChild("Hud");
Fusion:Hydrate(gui::FindFirstChild("Coins"));`,
	`local gui = playerGui:WaitForChild("Hud")
Fusion.Hydrate(gui:FindFirstChild("Coins"))`,
)}

<h3>Tween / spring a number</h3>
${codePair(
	`FusionState raw = Fusion:Value(0);
FusionState motion = Fusion:Spring(raw, 25, 1);
FusionState faded = Fusion:Tween(raw, TweenInfo(0.2));`,
	`local raw = Fusion.Value(0)
local motion = Fusion.Spring(raw, 25, 1)
local faded = Fusion.Tween(raw, TweenInfo.new(0.2))`,
)}
<p>Cleanup: keep a Janitor on the LocalScript and <code>Fusion:doCleanup</code> / destroy the ScreenGui on character removing. Fusion scopes (<code>scoped</code>, <code>innerScope</code>) are the same names as upstream 0.3/0.4.</p>

<h2>3. Vide — reactive sources, not shipped</h2>
<p>Vide tracks which <code>source</code> you read inside <code>root</code> / <code>derive</code>. Cluaupp has no Vide header and does not copy the Luau. Put <a href="https://github.com/centau/vide">centau/vide</a> on the Rojo tree yourself. The spelling below is the subset: functions and tables, no JSX.</p>

<h3>Root + source + create</h3>
${codePair(
	`Vide:root(func []() {
	VideState coins = Vide:source(0);
	Vide:create("TextLabel")({
		.Name = "Coins",
		.Parent = gui,
		.Size = UDim2:fromScale(1, 0.1),
		.BackgroundTransparency = 1,
	});
});`,
	`vide.root(function()
	local coins = vide.source(0)
	vide.create("TextLabel")({
		Name = "Coins",
		Parent = gui,
		Size = UDim2.fromScale(1, 0.1),
		BackgroundTransparency = 1,
	})
end)`,
)}

<h3>Derived string</h3>
${codePair(
	`VideState coins = Vide:source(0);
VideState caption = Vide:derive(func []() {
	return string_concat("Coins: ", coins());
});`,
	`local coins = vide.source(0)
local caption = vide.derive(function()
	return "Coins: " .. coins()
end)`,
)}

<h3>Apply to an existing Instance</h3>
<p>Like Fusion hydrate: you already have a label in Studio.</p>
${codePair(
	`TextLabel* label = gui::FindFirstChild("Coins");
Vide:apply(label)({
	.TextScaled = true,
});`,
	`local label = gui:FindFirstChild("Coins")
vide.apply(label)({
	TextScaled = true,
})`,
)}

<h3>Same DataService pattern as Fusion</h3>
${codePair(
	`VideState coins = Vide:source(0);
Data* data = DataService:Client::WaitForData();
if (data) {
	coins(data::Get(DataService:Client.Paths.Currencies.Coins));
	data::GetChangedSignal(DataService:Client.Paths.Currencies.Coins)::Connect(
		func [](int newValue) {
			coins(newValue);
		}
	);
}`,
	`local coins = vide.source(0)
local data = DataService.Client:WaitForData()
if data then
	coins(data:Get(DataService.Client.Paths.Currencies.Coins))
	data:GetChangedSignal(DataService.Client.Paths.Currencies.Coins):Connect(function(newValue: number)
		coins(newValue)
	end)
end`,
)}
<p>Fusion vs Vide: both are reactive graphs. Fusion ships with Cluaupp. Vide is smaller / source-based. Pick one per project; do not mix two graphs on the same ScreenGui.</p>

<h2>4. Roact / React — virtual tree, not shipped</h2>
<p>This is the Cluaupp version of the <a href="https://roblox-ts.com/docs/guides/roact-jsx">roblox-ts Roact JSX guide</a>. jsdotlua React and legacy Roact share <code>createElement(type, props, ...children)</code>. Cluaupp cannot parse <code>&lt;frame /&gt;</code>.</p>

<h3>Host component (a Roblox class)</h3>
<p>JSX <code>&lt;frame Size={...}&gt;</code> is a string type <code>"Frame"</code>.</p>
${codePair(
	`ReactElement child = React:createElement("Frame", {
	.Key = "Child",
	.Size = UDim2:fromScale(1, 1),
});
ReactElement tree = React:createElement("Frame", {
	.Size = UDim2(1, 0, 1, 0),
}, child);`,
	`local child = React.createElement("Frame", {
	Key = "Child",
	Size = UDim2.fromScale(1, 1),
})
local tree = React.createElement("Frame", {
	Size = UDim2.new(1, 0, 1, 0),
}, child)`,
)}

<h3>Function component (PascalCase)</h3>
<p>JSX <code>&lt;CoinsLabel value={n} /&gt;</code> is a function, not a string.</p>
${codePair(
	`ReactElement CoinsLabel(CoinsLabelProps props) {
	return React:createElement("TextLabel", {
		.Text = string_concat("Coins: ", props.value),
		.Size = UDim2:fromScale(1, 0.1),
		.BackgroundTransparency = 1,
	});
}

ReactElement hud = React:createElement(CoinsLabel, {
	.value = 10,
});`,
	`const function CoinsLabel(props)
	return React.createElement("TextLabel", {
		Text = "Coins: " .. props.value,
		Size = UDim2.fromScale(1, 0.1),
		BackgroundTransparency = 1,
	})
end

local hud = React.createElement(CoinsLabel, {
	value = 10,
})`,
)}

<h3>Key, Ref, Change, Event</h3>
<p>In JSX these are special attributes. In Cluaupp they are ordinary table fields. <code>Change</code> / <code>Event</code> are nested tables (the double curly braces in TSX).</p>
${codePair(
	`ReactRef ref = React:createRef();
ReactElement button = React:createElement("TextButton", {
	.Key = "Buy",
	.Ref = ref,
	.Text = "Buy",
	.Change = {
		.AbsoluteSize = func [](GuiObject* rbx) {
			post(rbx::GetFullName());
		},
	},
	.Event = {
		.Activated = func [](GuiObject* rbx) {
			post("clicked");
		},
	},
});`,
	`local ref = React.createRef()
local button = React.createElement("TextButton", {
	Key = "Buy",
	Ref = ref,
	Text = "Buy",
	Change = {
		AbsoluteSize = function(rbx)
			print(rbx:GetFullName())
		end,
	},
	Event = {
		Activated = function(rbx)
			print("clicked")
		end,
	},
})`,
)}

<h3>Children and conditionals</h3>
<p>JSX <code>{condition &amp;&amp; &lt;frame /&gt;}</code> is an extra argument (or a nil you skip). There is no spread <code>{...items}</code> in CL++ — build the child list with functions, then pass it.</p>
${codePair(
	`ReactElement extra = null;
if (showPanel) {
	extra = React:createElement("Frame", {
		.Key = "Panel",
	});
}
ReactElement tree = React:createElement("Frame", {
	.Size = UDim2:fromScale(1, 1),
}, extra);`,
	`local extra = nil
if showPanel then
	extra = React.createElement("Frame", {
		Key = "Panel",
	})
end
local tree = React.createElement("Frame", {
	Size = UDim2.fromScale(1, 1),
}, extra)`,
)}

<h3>Fragment</h3>
${codePair(
	`ReactElement fragment = React:createElement(React:Fragment, {},
	React:createElement("TextLabel", { .Key = "A", .Text = "A" }),
	React:createElement("TextLabel", { .Key = "B", .Text = "B" })
);`,
	`local fragment = React.createElement(React.Fragment, {},
	React.createElement("TextLabel", { Key = "A", Text = "A" }),
	React.createElement("TextLabel", { Key = "B", Text = "B" })
)`,
)}

<h3>Mount</h3>
${codePair(
	`React:mount(tree, playerGui);
// Roact: Roact:mount(tree, playerGui, "Hud")`,
	`React.mount(tree, playerGui)`,
)}
<p>Unmount on character removing / Janitor so you do not leak a second Hud. Names of mount / unmount follow the package you added (React vs Roact).</p>

<h2>5. Iris — immediate debug UI, shipped</h2>
<p>Iris is <em>not</em> a retained HUD. Every frame it draws widgets inside <code>Connect</code>. Use it for cheats, economy inspectors, Studio-only panels. Players should not see it in production.</p>
${codePair(
	`#include <clpp/roblox.clh>
#include <clpp/libs/iris.clh>
#include <clpp/libs/dataservice.clh>

void DrawEconomy() {
	if (Iris:Window("Economy")) {
		Data* data = DataService:Client::Get();
		if (data) {
			int coins = data::Get(DataService:Client.Paths.Currencies.Coins);
			Iris:Text(string_concat("Coins: ", coins));
		}
		if (Iris:Button("Print player")) {
			post(GetService<Players>().LocalPlayer.Name);
		}
		Iris:Checkbox("Verbose");
		Iris:Separator();
		if (Iris:Tree("Inventory")) {
			Iris:Text("hotbar slots");
			Iris:End();
		}
		Iris:End();
	}
}

void init() {
	Iris:Init();
	Iris:Connect(DrawEconomy);
}`,
	`local Iris = require(ReplicatedStorage.CluauppLibs.Iris)

const function DrawEconomy()
	if Iris.Window("Economy") then
		Iris.Text("Coins: ...")
		if Iris.Button("Print player") then
			print(game:GetService("Players").LocalPlayer.Name)
		end
		Iris.End()
	end
end

const function init()
	Iris.Init()
	Iris:Connect(DrawEconomy)
end`,
)}
<p>Always pair <code>Window</code> / <code>Tree</code> / <code>Tab</code> with <code>Iris:End()</code>. That is the immediate-mode contract, same as Dear ImGui.</p>

<h2>6. Polish on Instances you already have</h2>
<p>These are not virtual DOMs. You create a Frame (imperative, Fusion, or React), then animate or pin it.</p>

<h3>Twinkle — show / hide</h3>
${codePair(
	`#include <clpp/libs/twinkle.clh>

Twinkle:Fade(shopFrame, true);
Twinkle:FrameSlide(shopFrame, true, 0.25);
Twinkle:SetButtonStyle(buyButton);`,
	`Twinkle.Fade(shopFrame, true)
Twinkle.FrameSlide(shopFrame, true, 0.25)
Twinkle.SetButtonStyle(buyButton)`,
)}

<h3>TopbarPlus — Icon on the topbar</h3>
${codePair(
	`#include <clpp/libs/topbarplus.clh>

Icon* shop = Icon:new_();
shop::setName("Shop");
shop::setLabel("Shop");
shop::align("right");
shop::bindToggleItem(shopFrame);
shop::bindEvent("selected", func []() {
	post("shop open");
});`,
	`local shop = Icon.new()
shop:setName("Shop")
shop:setLabel("Shop")
shop:align("right")
shop:bindToggleItem(shopFrame)
shop:bindEvent("selected", function()
	print("shop open")
end)`,
)}

<h3>EzVisualz — stroke / rainbow on a GuiObject</h3>
${codePair(
	`#include <clpp/libs/ezvisual.clh>

EzVisualz* glow = EzVisualz:new_(title, "Rainbow", 1, 1);
glow::Play();`,
	`local glow = EzVisualz.new(title, "Rainbow", 1, 1)
glow:Play()`,
)}

<h3>StickyBillboard — world-space label</h3>
${codePair(
	`#include <clpp/libs/stickybillboard.clh>

StickyBillboard* tag = StickyBillboard:new_(part, title);
tag::SetText(player.Name);
tag::SetMaxDistance(80);`,
	`local tag = StickyBillboard.new(part, title)
tag:SetText(player.Name)
tag:SetMaxDistance(80)`,
)}

<h2>Do not mix these blindly</h2>
<table>
<tr><th>Mix</th><th>Result</th></tr>
<tr><td>Fusion graph + React mount on the same ScreenGui</td><td>Two owners fight the Instance tree</td></tr>
<tr><td>Iris Window as the live HUD</td><td>Redraws every frame; looks like a debug overlay</td></tr>
<tr><td>Client <code>data::Set</code> on persisted Paths</td><td>Will not save; write on the server</td></tr>
<tr><td>JSX in a <code>.clpp</code></td><td>Parse error. Use <code>createElement</code> / <code>Fusion:New</code></td></tr>
</table>
<p>One ScreenGui, one owner. Fusion <em>or</em> Vide <em>or</em> React <em>or</em> raw Instances. Twinkle / TopbarPlus / EzVisualz can decorate that owner’s Instances. Iris stays on a debug ScreenGui of its own.</p>`;
}
