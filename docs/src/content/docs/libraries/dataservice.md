---
title: DataService
---

Player profiles (DataServiceV2). Header: `#include <clpp/libs/dataservice.clh>`.

The **save shape is yours**. Do not put `Currencies` / `Money` on the library `DataPath` type. Define a struct in the game (shared header) and pass it as `.Template`.

## 1. Template (shared)

```clpp
#pragma once

struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};
```

Luau `DataService.Paths` follows this table (`Paths.Currencies.Money`).

## 2. Start the server

Call **once** from a server boot script (`DataBoot.server.clpp`). `void init()` is the entry (not `int main()`).

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>
#include "../shared/PlayerData.clh"

void init() {
	TemplateData playerData = TemplateData {};
	DataService.Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData",
		.UseMock = true,
	});
}
```

| Field | Meaning |
| --- | --- |
| `.Template` | Default document. Must match the save struct. |
| `.StoreName` | DataStore name (or a version string you own). |
| `.UseMock` | `true` in Studio / tests so you do not hit the live store. |
| `.KeyPrefix` | Optional prefix on profile keys. |
| `.StrictPaths` | Reject unknown path segments. |
| `.AutoCreateMissingTables` | Create missing nested tables on write. |

## 3. Start the client

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>

void init() {
	DataService.Client.Init();
}
```

## 4. Read / wait

```clpp
Data data = DataService.Server.WaitFor(player);
guard (data != null) else {
	return;
}

int money = data.Get(DataService.Server.Paths.Currencies.Money);
```

- `WaitFor` — yield until the profile exists.
- `Get(player)` — already loaded or `null`.
- `data.Get()` with no path — whole table.
- `GetPersisted` / `GetTransient` — saved vs session-only.

Client: `DataService.Client.WaitForData()` / `Get()`.

## 5. Write and listen

```clpp
data.Set(DataService.Server.Paths.Currencies.Money, 10);

void OnCurrenciesChanged() {
	return;
}

data.GetChangedSignal(DataService.Server.Paths.Currencies)~>Connect(OnCurrenciesChanged);
data.GetChangedSignal(DataService.Server.Paths.Currencies.Coins)~>Connect(func (int coins) {
	post(coins);
});
```

`GetChangedSignal` fires when that path (or a child) changes. Use a named function or `func (int newValue) { ... }`.

## Rules

- Init on **server and client**. Writes that must persist belong on the server.
- Paths are not a C++ enum in the library. They exist because your Template was passed to `Init`.
- Keep boot (`Init`) in one file. Keep HUD / leaderstats in another and `WaitFor` there.

Full copies: [Data boot](../examples/data-boot.md), [Leaderstats](/examples/leaderstats/), [HUD](../examples/hud.md).
