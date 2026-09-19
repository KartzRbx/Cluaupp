---
title: Services
---

Write **one tagged file per system**. Cluaupp emits **one** Luau instance: `LeaderstatsServer.server.luau` from `LeaderstatsServer.server.clpp`. It does not invent Main / Controller / Types unless `"architecture": true`.

## Example: leaderstats

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>
#include <clpp/libs/keep.clh>

void EnsureStat(Folder folder, string name, int value) {
	return;
}

void ApplyCurrencies(Player player, Data data) {
	return;
}

void OnCurrenciesChanged() {
	return;
}

void SetupPlayerManager(Player player) {
	Data data = Keep.Server.WaitFor(player);
	if (data == null) {
		return;
	}
	ApplyCurrencies(player, data);
	data.GetChangedSignal(Keep.Server.Paths.Currencies)~>Connect(OnCurrenciesChanged);
}

void init() {
	auto players = GetService<Players>();
	players.PlayerAdded~>Connect(SetupPlayerManager);
}
```

Typical output:

```
out/ServerScriptService/Handlers/LeaderstatsServer.server.luau
```

Your functions stay in that file. `init()` runs at the end. There is no fake `Main` that only forwards to a Controller.

## Lifecycle

You own `init` and Janitor cleanup in the same file. You do not write `class LeaderstatsServer` — name the **file** `LeaderstatsServer.server.clpp` and keep **functions** as the public API.

`"architecture": true` is the old ForeverHD split (`Main.Start` / `Main.Stop`, Managers, Types). Leave it off unless you want that.

## Boot vs gameplay

Keep `Keep.Server.Init` in `DataBoot.server.clpp`. Keep `Keep.Client.Init` in `DataController.client.clpp`. Handlers `WaitFor` after boot has run.

## Opt-in roles (`"architecture": true`)

| Your C++ | Generated role |
| --- | --- |
| `PlayerAdded`, `GetPlayers` | `PlayersManager` |
| `Folder` + `IntValue` | `CacheController` |
| `DataService`, `GetChangedSignal` | `DataController` |
| `TakeDamage`, `Humanoid` | `CombatController` |
| `Net::Event` | `NetController` |
| `UserInputService` | `InputController` |
| wiring | `Main.Start` / `Main.Stop` |

A tiny `print` in `init.client.clpp` stays a single LocalScript.

Copy-paste: [Examples](/examples/).
