---
title: Leaderstats
---

Canonical copy (three files): [Docs → Example: Leaderstats](/examples/leaderstats/).

Roblox shows the player list from a Folder named exactly `leaderstats` under the Player. This service **creates** those values, then mirrors DataService coins into them.

It does **not** call `DataService.Init`. Boot that in [Data boot](/examples/data-boot/) with your `PlayerData` Template.

## Files

| File | Role |
| --- | --- |
| `shared/PlayerData.clh` | Template structs (`Currencies.Coins`, inventory `LuaArray`) |
| `server/LeaderstatsServer.clh` | `struct LeaderstatsServer` — fields + method decls (same stem) |
| `server/LeaderstatsServer.server.clpp` | `Class::` bodies + `void init()` |

## Rules

| Rule | Why |
| --- | --- |
| Same-stem header | `LeaderstatsServer.clh` + `LeaderstatsServer.server.clpp`. A differently named `leaderstats.clh` is a `require`. |
| `.server.clpp` | Untagged cpp is a ModuleScript; `init()` will not run by itself. |
| `Paths.Currencies.Coins` | After `Init`. A local `int Coins` is not a Data path. |
| `string_concat` or string `+` | Luau `..`. Do not write `..` in the `.cpp`. |
| Janitor keyed by player name | Leaving the game must `Destroy` the folder. |
| Lambda or named function | `GetChangedSignal(...).Connect([coinsValue](int n) { ... })` is valid. |

## Header

```clpp
#pragma once
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>
#include <clpp/libs/dataservice.clh>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;
	Janitor janitor;
	string GetPlayerJanitorKey(Player player);
	void UpdateLeaderstatsWithValues(IntValue currentValue, int newValue);
	Folder EnsurePlayerLeaderstatsFolder(Player player);
	void PlayerEntered(Player player);
};
```

## `PlayerEntered`

```clpp
void LeaderstatsServer::PlayerEntered(Player player) {
	Folder leaderstatsFolder = EnsurePlayerLeaderstatsFolder(player);
	Data playerData = DataService.Server.WaitFor(player);
	IntValue coinsValue = static_cast<IntValue>(leaderstatsFolder.FindFirstChild("Coins"));
	if (coinsValue) {
		playerData.GetChangedSignal(DataService.Server.Paths.Currencies.Coins)~>Connect(func (int newValue) {
				UpdateLeaderstatsWithValues(coinsValue, newValue);
			}
		);
	}
	janitor.Add(leaderstatsFolder, "Destroy", GetPlayerJanitorKey(player));
}
```

`init()` constructs `LeaderstatsServer`, assigns `janitor = new Janitor()`, runs `PlayerEntered` for everyone already in the game, then `PlayerAdded` + `BindToClose`. Full listing is on the [handbook page](/examples/leaderstats/).
