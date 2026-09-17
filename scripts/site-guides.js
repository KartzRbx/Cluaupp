"use strict";

function createGuides({ codePair, preCode }) {
	function printCoutInner() {
		return `<p class="muted">Cluaupp has no <code>&lt;iostream&gt;</code>. Logging is Roblox <code>print</code> / <code>warn</code> / <code>error</code>. You can still write C++-style <code>cout</code> / <code>cerr</code> / <code>endl</code> — the compiler flattens them.</p>
<h2>Globals</h2>
${codePair(
	`print("ok");
warn("careful");
error("fail");`,
	`print("ok")
warn("careful")
error("fail")`,
)}
<h2>Stream: cout &lt;&lt; … &lt;&lt; endl</h2>
<p>Each <code>&lt;&lt;</code> is another argument. <code>endl</code> ends the statement. <code>cerr</code> emits <code>warn</code>.</p>
${codePair(
	`cout << "EnsureStat: " << name << " not found" << endl;
cerr << "failed to load " << player->Name << endl;`,
	`print("EnsureStat: ", name, " not found")
warn("failed to load ", player.Name)`,
)}
<h2>Levels: cout::print / warn / error / ping</h2>
<p><code>cout::ping</code> is a debug alias of <code>print</code>.</p>
${codePair(
	`cout::print << "EnsureStat: " << name << " not found" << endl;
cout::warn << "missing folder for " << player->Name << endl;
cout::error << "profile failed" << endl;
cout::ping << "here" << endl;
cout::print("ok");
cout::warn("careful");`,
	`print("EnsureStat: ", name, " not found")
warn("missing folder for ", player.Name)
error("profile failed")
print("here")
print("ok")
warn("careful")`,
)}
<table>
<tr><th>C++</th><th>Luau</th></tr>
<tr><td><code>cout &lt;&lt; … &lt;&lt; endl</code></td><td><code>print(…)</code></td></tr>
<tr><td><code>cout::print &lt;&lt; … &lt;&lt; endl</code></td><td><code>print(…)</code></td></tr>
<tr><td><code>cout::warn &lt;&lt; … &lt;&lt; endl</code></td><td><code>warn(…)</code></td></tr>
<tr><td><code>cout::error &lt;&lt; … &lt;&lt; endl</code></td><td><code>error(…)</code></td></tr>
<tr><td><code>cout::ping &lt;&lt; … &lt;&lt; endl</code></td><td><code>print(…)</code></td></tr>
<tr><td><code>cerr &lt;&lt; … &lt;&lt; endl</code></td><td><code>warn(…)</code></td></tr>
</table>
<p class="note"><code>struct cout</code> lives in <code>&lt;cluaupp/roblox.hpp&gt;</code> so clangd knows <code>operator&lt;&lt;</code>.</p>`;
	}

	function librariesInner() {
		return `<p class="muted"><code>#include &lt;cluaupp/libs/…hpp&gt;</code> is IntelliSense. <code>cluaupp build</code> copies Luau into <code>ReplicatedStorage.CluauppLibs</code>. You do not <code>require</code> by hand in C++.</p>
<h2>DataService — Init</h2>
<p>The save <strong>shape is yours</strong>. Do not put <code>Currencies</code> on the library type. Define a struct in the game and pass it as <code>.Template</code>.</p>
${preCode(`#pragma once

struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};`, "cpp")}
<p>Server boot — <code>void init()</code>, not <code>int main()</code>:</p>
${codePair(
	`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include "../../shared/constants/TemplateData.hpp"

void init() {
	TemplateData playerData = TemplateData {};
	DataService::Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData_v1",
		.UseMock = true,
	});
}`,
	`--!strict
const ReplicatedStorage = game:GetService("ReplicatedStorage")
const DataService = require(ReplicatedStorage.CluauppLibs.DataService)

const function init()
	const playerData = {}
	DataService.Server:Init({
		Template = playerData,
		StoreName = "PlayerData_v1",
		UseMock = true,
	})
end

init()`,
)}
<p>Client: <code>DataService::Client.Init();</code> with no Template. Gameplay scripts <code>WaitFor</code> — they never call <code>Init</code> again.</p>
${codePair(
	`Data* data = DataService::Server.WaitFor(player);
if (data == nullptr) {
	return;
}
int money = data->Get(DataService::Server.Paths.Currencies.Money);
data->Set(DataService::Server.Paths.Currencies.Money, money + 5);
data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged);`,
	`local data = DataService.Server:WaitFor(player)
if data == nil then
	return
end
local money = data:Get(DataService.Server.Paths.Currencies.Money)
data:Set(DataService.Server.Paths.Currencies.Money, money + 5)
data:GetChangedSignal(DataService.Server.Paths.Currencies):Connect(OnCurrenciesChanged)`,
)}
<p class="note"><code>Paths.Currencies</code> exists because <em>your</em> Template had that table.</p>
<h2>Janitor</h2>
<p>No fake <code>Has</code>. Use <code>Get</code>. <code>Remove</code> on a missing index is a no-op.</p>
${codePair(
	`auto* janitor = new Janitor();
janitor->Add(Players->PlayerAdded.Connect(OnPlayer));
janitor->Add(part, "Destroy");
janitor->Add(section, "Destroy", player->Name);
if (janitor->Get(player->Name)) {
	janitor->Remove(player->Name);
}
janitor->LinkToInstance(player);
janitor->Cleanup();
janitor->Destroy();`,
	`local janitor = Janitor.new()
janitor:Add(Players.PlayerAdded:Connect(OnPlayer))
janitor:Add(part, "Destroy")
janitor:Add(section, "Destroy", player.Name)
if janitor:Get(player.Name) then
	janitor:Remove(player.Name)
end
janitor:LinkToInstance(player)
janitor:Cleanup()
janitor:Destroy()`,
)}
<h2>Net</h2>
<p>Same string on server and client. Client sends <strong>intent</strong>, never the new balance.</p>
${codePair(
	`auto* buy = Net::Event("Buy");
buy->On(OnBuy);
buy->FireServer(PRODUCT_HEALTH_PACK);`,
	`local buy = Net.Event("Buy")
buy:On(OnBuy)
buy:FireServer(PRODUCT_HEALTH_PACK)`,
)}
<table>
<tr><th>Library</th><th>Header</th><th>Role</th></tr>
<tr><td>Janitor</td><td><code>&lt;cluaupp/libs/janitor.hpp&gt;</code></td><td>lifetime</td></tr>
<tr><td>Promise</td><td><code>&lt;cluaupp/libs/promise.hpp&gt;</code></td><td>Then / Catch / Await</td></tr>
<tr><td>Net</td><td><code>&lt;cluaupp/libs/net.hpp&gt;</code></td><td>buffer remotes</td></tr>
<tr><td>DataService</td><td><code>&lt;cluaupp/libs/dataservice.hpp&gt;</code></td><td>profiles</td></tr>
<tr><td>FormatNumber</td><td><code>&lt;cluaupp/libs/formatnumber.hpp&gt;</code></td><td>Abbreviate / Comma</td></tr>
<tr><td>Twinkle</td><td><code>&lt;cluaupp/libs/twinkle.hpp&gt;</code></td><td>UI motion</td></tr>
<tr><td>Fusion / Cmdr / Iris</td><td>matching headers</td><td>upstream APIs behind typed borders</td></tr>
</table>
<p>Wally is optional. Do not install a second Janitor from Wally.</p>`;
	}

	function oopInner() {
		return `<p class="muted">Cluaupp does <strong>not</strong> compile custom C++ <code>class</code> types yet. OOP here is how you lay out <em>typed data</em>, <em>named methods</em>, and <em>services</em> so Studio gets Main / Controller / Types — the same idea as roblox-ts filename keys + Flamework <code>@Service</code>, without decorators.</p>
<h2>The three layers</h2>
<table>
<tr><th>Layer</th><th>You write</th><th>Runtime</th></tr>
<tr><td>Data object</td><td><code>struct TemplateData</code>, <code>struct CombatConfig</code></td><td>Luau table + <code>export type</code> in <code>*Types.luau</code></td></tr>
<tr><td>Methods</td><td>named functions with typed args (<code>Player*</code>, <code>Humanoid*</code>, <code>int</code>)</td><td><code>const function</code> on the Controller</td></tr>
<tr><td>Lifetime</td><td><code>void init()</code> + Janitor</td><td>generated <code>Main.Start</code> / <code>Main.Stop</code></td></tr>
</table>
<h2>File tags decide the instance</h2>
<table>
<tr><th>Source</th><th>Instance</th><th>RunContext</th></tr>
<tr><td><code>CombatServer.server.cpp</code></td><td><strong>Script</strong></td><td><strong>Server</strong> (<code>init.luau</code> + <code>init.meta.json</code>)</td></tr>
<tr><td><code>CombatClient.client.cpp</code></td><td>LocalScript</td><td>Client</td></tr>
<tr><td><code>Sword.legacy.server.cpp</code></td><td>Script</td><td>Legacy (1:1 dump, lives under a Tool)</td></tr>
<tr><td><code>Damage.cpp</code> (no tag)</td><td>ModuleScript</td><td>—</td></tr>
</table>
<p class="note"><code>.server.cpp</code> is not <code>init.server.luau</code>. Rojo maps <code>*.server.luau</code> to RunContext <strong>Legacy</strong>. Cluaupp emits <code>init.luau</code> + meta <code>Enum.RunContext.Server</code>.</p>
<h2>Structs are the typed class fields</h2>
<p>Put shapes in shared headers. Designated initializers become tables. Methods are functions that take the instance in — composition, not <code>this-&gt;</code>.</p>
${codePair(
	`#pragma once

struct CombatConfig {
	double Range = 12;
	double Cooldown = 0.4;
	int Damage = 12;
	int KillReward = 5;
};

struct EconomySnapshot {
	int Money = 0;
	int Level = 1;
};

struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};`,
	`-- generated *Types.luau (shape)
export type CombatConfig = {
	Range: number,
	Cooldown: number,
	Damage: number,
	KillReward: number,
}

export type EconomySnapshot = {
	Money: number,
	Level: number,
}

return {}`,
)}
<h2>What you do not write</h2>
${preCode(`class Shop {
	int price;
	void Buy(Player* player);
};`, "cpp")}
<p>Split that into a <code>struct</code> (fields) + functions (methods) + a <code>.server.cpp</code> (lifetime).</p>
<h2>Advanced typed service — Combat</h2>
<p>Config is a typed struct. Each check is a function with Instance types. Damage is a <code>const</code> on the config — the client never sends it. This is the OOP you can ship today.</p>
<p><code>src/shared/types/CombatTypes.hpp</code></p>
${preCode(`#pragma once

struct CombatConfig {
	double Range = 12;
	double Cooldown = 0.4;
	int Damage = 12;
	int KillReward = 5;
};`, "cpp")}
<p><code>src/server/services/combat/CombatServer.server.cpp</code></p>
${codePair(
	`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include "../../../shared/types/CombatTypes.hpp"

Players* Players = GetService<Players>();
Janitor* janitor = new Janitor();
NetEvent* Attack = Net::Event("Attack");

CombatConfig Config = CombatConfig {
	.Range = 12,
	.Cooldown = 0.4,
	.Damage = 12,
	.KillReward = 5,
};

Humanoid* HumanoidOf(Model* character) {
	if (character == nullptr) {
		return nullptr;
	}
	return character->FindFirstChildOfClass("Humanoid");
}

BasePart* RootOf(Model* character) {
	if (character == nullptr) {
		return nullptr;
	}
	return character->FindFirstChild("HumanoidRootPart");
}

Player* ResolveTarget(int targetUserId) {
	if (targetUserId < 1) {
		return nullptr;
	}
	return Players->GetPlayerByUserId(targetUserId);
}

bool IsAlive(Humanoid* humanoid) {
	if (humanoid == nullptr) {
		return false;
	}
	if (humanoid->Health <= 0) {
		return false;
	}
	return true;
}

bool InRange(Model* a, Model* b, double maxRange) {
	BasePart* rootA = RootOf(a);
	BasePart* rootB = RootOf(b);
	if (rootA == nullptr) {
		return false;
	}
	if (rootB == nullptr) {
		return false;
	}
	Vector3 delta = rootA->Position - rootB->Position;
	if (delta.Magnitude > maxRange) {
		return false;
	}
	return true;
}

bool OnCooldown(Player* attacker) {
	NumberValue* last = attacker->FindFirstChild("LastAttackAt");
	if (last == nullptr) {
		return false;
	}
	if (tick() - last->Value < Config.Cooldown) {
		return true;
	}
	return false;
}

void StampCooldown(Player* attacker) {
	NumberValue* last = attacker->FindFirstChild("LastAttackAt");
	if (last == nullptr) {
		last = new NumberValue(attacker);
		last->Name = "LastAttackAt";
	}
	last->Value = tick();
}

void GrantKill(Player* attacker) {
	Data* data = DataService::Server.Get(attacker);
	if (data == nullptr) {
		return;
	}
	int money = data->Get(DataService::Server.Paths.Currencies.Money);
	data->Set(DataService::Server.Paths.Currencies.Money, money + Config.KillReward);
}

void OnAttack(Player* attacker, int targetUserId) {
	if (attacker == nullptr) {
		return;
	}
	if (OnCooldown(attacker)) {
		return;
	}
	Player* target = ResolveTarget(targetUserId);
	if (target == nullptr) {
		return;
	}
	if (target == attacker) {
		return;
	}
	Humanoid* attackerHum = HumanoidOf(attacker->Character);
	Humanoid* targetHum = HumanoidOf(target->Character);
	if (IsAlive(attackerHum) == false) {
		return;
	}
	if (IsAlive(targetHum) == false) {
		return;
	}
	if (InRange(attacker->Character, target->Character, Config.Range) == false) {
		cout::ping << attacker->Name << " out of range" << endl;
		return;
	}
	StampCooldown(attacker);
	double healthBefore = targetHum->Health;
	targetHum->TakeDamage(Config.Damage);
	if (healthBefore > 0) {
		if (targetHum->Health <= 0) {
			GrantKill(attacker);
		}
	}
}

void init() {
	Attack->On(OnAttack);
	janitor->Add(Attack);
}`,
	`-- Compiled by Cluaupp — C++ × Luau

const Players = game:GetService("Players")
const ReplicatedStorage = game:GetService("ReplicatedStorage")
const Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)
const Net = require(ReplicatedStorage.CluauppLibs.Net)
const DataService = require(ReplicatedStorage.CluauppLibs.DataService)

const Config = {
	Range = 12,
	Cooldown = 0.4,
	Damage = 12,
	KillReward = 5,
}

const function HumanoidOf(character: Model): Humanoid?
	if character == nil then
		return nil
	end
	return character:FindFirstChildOfClass("Humanoid")
end

const function OnAttack(attacker: Player, targetUserId: number)
	-- ResolveTarget, IsAlive, InRange, StampCooldown, TakeDamage(Config.Damage)
end`,
)}
<p>Cluaupp turns that file into one Script:</p>
${preCode(`out/server/services/combat/CombatServer.server.luau
  -- your typed functions + init() at the end`, "plain")}
<p>Keep DataService boot in <code>DataBoot.server.cpp</code>. Combat stays in this file. Set <code>"architecture": true</code> only if you want a PascalCase folder with Main / Controller / Types.</p>
<h2>Client half (intent only)</h2>
${codePair(
	`void OnInputBegan(InputObject* input, bool gameProcessed) {
	if (gameProcessed) {
		return;
	}
	if (input->UserInputType != Enum::UserInputType::MouseButton1) {
		return;
	}
	Player* localPlayer = Players->LocalPlayer;
	Mouse* mouse = localPlayer->GetMouse();
	Instance* model = mouse->Target->FindFirstAncestorOfClass("Model");
	Player* target = Players->GetPlayerFromCharacter(model);
	if (target == nullptr) {
		return;
	}
	Attack->FireServer(target->UserId);
}`,
	`const function OnInputBegan(input: InputObject, gameProcessed: boolean)
	if gameProcessed then
		return
	end
	if input.UserInputType ~= Enum.UserInputType.MouseButton1 then
		return
	end
	local target = Players:GetPlayerFromCharacter(model)
	Attack:FireServer(target.UserId)
end`,
)}
<p>The remote payload is <code>UserId</code> — never <code>Config.Damage</code>.</p>
<h2>Suggested disk layout</h2>
${preCode(`src/
  shared/types/CombatTypes.hpp
  shared/constants/TemplateData.hpp
  server/boot/DataBoot.server.cpp
  client/boot/DataBoot.client.cpp
  server/services/combat/CombatServer.server.cpp
  client/controllers/combat/CombatClient.client.cpp
  server/services/leaderstats/LeaderstatsServer.server.cpp`, "plain")}
<p>One tagged file per system. Boot <code>Init</code> once. Other services <code>WaitFor</code>.</p>`;
	}

	function examplesInner() {
		return `<p class="muted">Copy-paste systems. Entry is <code>void init()</code>. No lambdas. No custom C++ classes.</p>
<h2>1. Data boot</h2>
<p>Call <code>Init</code> once on server and once on client. Other services only <code>WaitFor</code>.</p>
${codePair(
	`#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include "../../shared/constants/TemplateData.hpp"

void init() {
	TemplateData playerData = TemplateData {};
	DataService::Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData_v1",
		.UseMock = true,
	});
}`,
	`const function init()
	DataService.Server:Init({
		Template = {},
		StoreName = "PlayerData_v1",
		UseMock = true,
	})
end

init()`,
)}
<p>Client: <code>DataService::Client.Init();</code></p>
<h2>2. Leaderstats</h2>
<p>Create the Folder and the stats when they are missing. Refresh from DataService. Section Janitor per player.</p>
${codePair(
	`void EnsureStat(Folder* leaderstats, string name) {
	Instance* existing = leaderstats->FindFirstChild(name);
	if (existing != nullptr) {
		return;
	}
	StringValue* stat = new StringValue(leaderstats);
	stat->Name = name;
	stat->Value = "0";
}

void SetStat(Folder* leaderstats, string name, int value) {
	StringValue* stat = leaderstats->FindFirstChild(name);
	if (stat == nullptr) {
		cout::warn << "leaderstats missing " << name << endl;
		return;
	}
	stat->Value = FormatNumber::Abbreviate(value);
}

void ApplyCurrencies(Player* player) {
	Data* data = DataService::Server.Get(player);
	if (data == nullptr) {
		return;
	}
	Folder* leaderstats = player->FindFirstChild("leaderstats");
	if (leaderstats == nullptr) {
		return;
	}
	SetStat(leaderstats, "Money", data->Get(DataService::Server.Paths.Currencies.Money));
	SetStat(leaderstats, "Level", data->Get(DataService::Server.Paths.Currencies.Level));
}

void SetupPlayer(Player* player) {
	Data* data = DataService::Server.WaitFor(player);
	if (data == nullptr) {
		return;
	}
	Folder* leaderstats = player->FindFirstChild("leaderstats");
	if (leaderstats == nullptr) {
		leaderstats = new Folder(player);
		leaderstats->Name = "leaderstats";
	}
	EnsureStat(leaderstats, "Money");
	EnsureStat(leaderstats, "Level");
	ApplyCurrencies(player);
	Janitor* section = new Janitor();
	section->Add(data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged));
	janitor->Add(section, "Destroy", player->Name);
}`,
	`const function EnsureStat(leaderstats: Folder, name: string)
	if leaderstats:FindFirstChild(name) ~= nil then
		return
	end
	local stat = Instance.new("StringValue")
	stat.Parent = leaderstats
	stat.Name = name
	stat.Value = "0"
end`,
)}
<p class="note">Do not <code>if (!money) { money-&gt;Value = … }</code> — that writes only when the child is missing. Set when the child <strong>exists</strong>.</p>
<h2>3. Combat (server validation)</h2>
<p>Full typed version lives in the <strong>OOP</strong> tab. Short rule: client fires <code>Attack-&gt;FireServer(target-&gt;UserId)</code>. Server checks cooldown, range, alive, then <code>TakeDamage(Config.Damage)</code>.</p>
<table>
<tr><th>Client cheat</th><th>Server check</th></tr>
<tr><td><code>FireServer(99999)</code> damage</td><td>Damage is <code>Config.Damage</code> — not an argument</td></tr>
<tr><td>Hit across the map</td><td><code>delta.Magnitude &gt; Config.Range</code></td></tr>
<tr><td>Spam click</td><td><code>LastAttackAt</code> + cooldown</td></tr>
<tr><td>Target self / userId 0</td><td><code>ResolveTarget</code>, <code>target == attacker</code></td></tr>
</table>
<h2>4. Shop</h2>
<p>Cluaupp has no maps. A function with early returns is the catalog — the server copy is the one that matters.</p>
${codePair(
	`const int PRODUCT_HEALTH_PACK = 1;

int PriceOf(int productId) {
	if (productId == PRODUCT_HEALTH_PACK) {
		return 50;
	}
	return 0;
}

void OnBuy(Player* player, int productId) {
	int price = PriceOf(productId);
	if (price < 1) {
		return;
	}
	Data* data = DataService::Server.WaitFor(player);
	int money = data->Get(DataService::Server.Paths.Currencies.Money);
	if (money < price) {
		return;
	}
	data->Set(DataService::Server.Paths.Currencies.Money, money - price);
	ApplyProduct(player, productId);
}`,
	`const function OnBuy(player: Player, productId: number)
	local price = PriceOf(productId)
	if price < 1 then
		return
	end
	local data = DataService.Server:WaitFor(player)
	local money = data:Get(DataService.Server.Paths.Currencies.Money)
	if money < price then
		return
	end
	data:Set(DataService.Server.Paths.Currencies.Money, money - price)
	ApplyProduct(player, productId)
end`,
)}
<h2>5. HUD (client)</h2>
${codePair(
	`void OnCurrenciesChanged() {
	Data* data = DataService::Client.Get();
	TextLabel* moneyLabel = FindLabel(playerGui, "MoneyLabel");
	if (moneyLabel != nullptr) {
		moneyLabel->Text = FormatNumber::Abbreviate(data->Get(DataService::Client.Paths.Currencies.Money));
	}
}

void init() {
	Data* data = DataService::Client.WaitForData();
	Render(data);
	janitor->Add(data->GetChangedSignal(DataService::Client.Paths.Currencies).Connect(OnCurrenciesChanged));
}`,
	`const function init()
	local data = DataService.Client:WaitForData()
	Render(data)
	janitor:Add(data:GetChangedSignal(DataService.Client.Paths.Currencies):Connect(OnCurrenciesChanged))
end`,
)}
<p>Display only. Never <code>Set</code> Money from the HUD.</p>
<h2>6. Sword — Touched on the server</h2>
<p>Use <code>.legacy.server.cpp</code> so the Script can live <em>inside</em> the Tool. <code>tool-&gt;Parent</code> is the Character while equipped.</p>
${codePair(
	`Tool* tool = script->Parent;

void OnTouched(Instance* hit) {
	Player* attacker = Players->GetPlayerFromCharacter(tool->Parent);
	Player* victim = Players->GetPlayerFromCharacter(hit->FindFirstAncestorOfClass("Model"));
	if (victim == nullptr) {
		return;
	}
	if (victim == attacker) {
		return;
	}
	Humanoid* humanoid = victim->Character->FindFirstChildOfClass("Humanoid");
	humanoid->TakeDamage(SWORD_DAMAGE);
}

void init() {
	BasePart* handle = tool->FindFirstChild("Handle");
	handle->Touched.Connect(OnTouched);
}`,
	`const tool = script.Parent

const function OnTouched(hit: Instance)
	local attacker = Players:GetPlayerFromCharacter(tool.Parent)
	-- cooldown, ignore self, TakeDamage(SWORD_DAMAGE)
end`,
)}
<h2>Layout</h2>
${preCode(`src/
  shared/constants/TemplateData.hpp
  shared/types/CombatTypes.hpp
  server/boot/DataBoot.server.cpp
  client/boot/DataBoot.client.cpp
  server/services/leaderstats/LeaderstatsServer.server.cpp
  server/services/combat/CombatServer.server.cpp
  client/controllers/combat/CombatClient.client.cpp
  server/services/shop/ShopServer.server.cpp
  client/controllers/hud/HudClient.client.cpp
  server/tools/Sword.legacy.server.cpp`, "plain")}`;
	}

	return {
		printCoutInner,
		librariesInner,
		oopInner,
		examplesInner,
	};
}

module.exports = { createGuides };
