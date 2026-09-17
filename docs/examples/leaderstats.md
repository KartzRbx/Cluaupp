---
title: Leaderstats
sidebar_position: 3
---

# Leaderstats

Canonical copy (three files): [Docs → Example: Leaderstats](https://kartzrbx.github.io/Cluaupp/docs/leaderstats.html).

Roblox shows the player list from a Folder named exactly `leaderstats` under the Player. This service **creates** those values, then mirrors DataService coins into them.

It does **not** call `DataService.Init`. Boot that in [Data boot](data-boot.md) with your `PlayerData` Template.

## Files

| File | Role |
| --- | --- |
| `shared/PlayerData.h` | Template structs (`Currencies.Coins`, inventory `LuaArray`) |
| `server/LeaderstatsServer.h` | `struct LeaderstatsServer` — fields + method decls (same stem) |
| `server/LeaderstatsServer.server.cpp` | `Class::` bodies + `void init()` |

## Rules

| Rule | Why |
| --- | --- |
| Same-stem header | `LeaderstatsServer.h` + `LeaderstatsServer.server.cpp`. A differently named `leaderstats.h` is a `require`. |
| `.server.cpp` | Untagged cpp is a ModuleScript; `init()` will not run by itself. |
| `Paths.Currencies.Coins` | After `Init`. A local `int Coins` is not a Data path. |
| `string_concat` or string `+` | Luau `..`. Do not write `..` in the `.cpp`. |
| Janitor keyed by player name | Leaving the game must `Destroy` the folder. |
| Lambda or named function | `GetChangedSignal(...).Connect([coinsValue](int n) { ... })` is valid. |

## Header

```cpp
#pragma once
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/dataservice.hpp>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;
	Janitor* janitor;
	string GetPlayerJanitorKey(Player* player);
	void UpdateLeaderstatsWithValues(IntValue* currentValue, int newValue);
	Folder* EnsurePlayerLeaderstatsFolder(Player* player);
	void PlayerEntered(Player* player);
};
```

## `PlayerEntered`

```cpp
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
```

`init()` constructs `LeaderstatsServer`, assigns `janitor = new Janitor()`, runs `PlayerEntered` for everyone already in the game, then `PlayerAdded` + `BindToClose`. Full listing is on the [handbook page](https://kartzrbx.github.io/Cluaupp/docs/leaderstats.html).
