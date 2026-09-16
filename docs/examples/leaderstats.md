---
title: Leaderstats
sidebar_position: 3
---

# Leaderstats

Roblox shows the player list from a Folder named exactly `leaderstats` under the Player, with `IntValue` / `StringValue` children. This service **creates** those values, then mirrors DataService currencies into them.

It does **not** call `DataService.Init`. Boot that in [Data boot](data-boot.md).

## Why this shape

| Rule | Why |
| --- | --- |
| Create the Folder if missing | `FindFirstChild` is not a constructor |
| Create the stat if missing | Returning early when it is absent never shows Money |
| `StringValue` + `FormatNumber::Abbreviate` | Player list wants a string like `1.5K` |
| Janitor per player, keyed by `player->Name` | Leaving the game must `Destroy` the section janitor |
| `GetChangedSignal(Paths.Currencies)` | HUD / list update without polling |
| Named function, not a lambda | Cluaupp has no lambdas. The shared callback refreshes **all** players (currency writes are rare) |

## `LeaderstatsServer.server.cpp`

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include <cluaupp/libs/formatnumber.hpp>

Players* Players = GetService<Players>();
Janitor* janitor = new Janitor();

void EnsureStat(Folder* leaderstats, string name) {
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

Folder* EnsureLeaderstats(Player* player) {
	Folder* leaderstats = player->FindFirstChild("leaderstats");
	if (leaderstats != nullptr) {
		return leaderstats;
	}
	leaderstats = new Folder(player);
	leaderstats->Name = "leaderstats";
	return leaderstats;
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
	int money = data->Get(DataService::Server.Paths.Currencies.Money);
	int level = data->Get(DataService::Server.Paths.Currencies.Level);
	SetStat(leaderstats, "Money", money);
	SetStat(leaderstats, "Level", level);
}

void OnCurrenciesChanged() {
	for (Player* player : Players->GetPlayers()) {
		ApplyCurrencies(player);
	}
}

void SetupPlayer(Player* player) {
	Data* data = DataService::Server.WaitFor(player);
	if (data == nullptr) {
		cout::warn << "no profile for " << player->Name << endl;
		return;
	}

	Folder* leaderstats = EnsureLeaderstats(player);
	EnsureStat(leaderstats, "Money");
	EnsureStat(leaderstats, "Level");
	ApplyCurrencies(player);

	Janitor* section = new Janitor();
	section->Add(data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged));
	section->Add(leaderstats, "Destroy");
	janitor->Add(section, "Destroy", player->Name);
}

void OnPlayerRemoving(Player* player) {
	if (janitor->Get(player->Name)) {
		janitor->Remove(player->Name);
	}
}

void OnClose() {
	janitor->Destroy();
}

void init() {
	for (Player* player : Players->GetPlayers()) {
		SetupPlayer(player);
	}
	janitor->Add(Players->PlayerAdded.Connect(SetupPlayer));
	janitor->Add(Players->PlayerRemoving.Connect(OnPlayerRemoving));
	game->BindToClose(OnClose);
}
```

## Output

`LeaderstatsServer.server.cpp` becomes a service folder: `init.luau` (Script, RunContext **Server**), `Main`, `PlayersManager`, `DataController` / `CacheController`, Types. Your functions stay in the domain controller. See [services](../oop/services.md).

## Bugs this example avoids

| Broken | Correct |
| --- | --- |
| `if (!existing) { return; }` then never create the value | `EnsureStat` **creates** when missing |
| `if (!money) { money->Value = ... }` | That writes only when the child is **nil** (crash / no-op). Set when the child **exists** |
| `DataService.Get` before `WaitFor` on join | `WaitFor` in `SetupPlayer`, `Get` in the refresh path |
| `int main()` | `void init()` |
| One global connection, never removed | Section janitor destroyed on `PlayerRemoving` |

`Paths.Currencies` is valid **after** your Template was passed to `Init`. The library header does not define those fields.

## IntValue vs StringValue

Use `IntValue` if you want the default numeric sort and no abbreviation. Use `StringValue` + `FormatNumber::Abbreviate` for `1.5K`. Do not mix both names (`Money` twice).
