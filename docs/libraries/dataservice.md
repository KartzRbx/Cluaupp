---
title: DataService
sidebar_position: 2
---

# DataService

Player profiles (DataServiceV2). Header: `#include <cluaupp/libs/dataservice.hpp>`.

The **save shape is yours**. Do not put `Currencies` / `Money` on the library `DataPath` type. Define a struct in the game (shared header) and pass it as `.Template`.

## 1. Template (shared)

```cpp
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

Call **once** from a server boot script (`DataBoot.server.cpp`). `void init()` is what Cluaupp runs (not `int main()`).

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include "../../shared/constants/TemplateData.hpp"

void init() {
	TemplateData playerData = TemplateData {};
	DataService::Server.Init(DataServiceOptions {
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

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/dataservice.hpp>

void init() {
	DataService::Client.Init();
}
```

## 4. Read / wait

```cpp
Data* data = DataService::Server.WaitFor(player);
if (data == nullptr) {
	return;
}

int money = data->Get(DataService::Server.Paths.Currencies.Money);
```

- `WaitFor` — yield until the profile exists.
- `Get(player)` — already loaded or `nullptr`.
- `data->Get()` with no path — whole table.
- `GetPersisted` / `GetTransient` — saved vs session-only.

Client: `DataService::Client.WaitForData()` / `Get()`.

## 5. Write and listen

```cpp
data->Set(DataService::Server.Paths.Currencies.Money, 10);

void OnCurrenciesChanged() {
	return;
}

data->GetChangedSignal(DataService::Server.Paths.Currencies).Connect(OnCurrenciesChanged);
data->GetChangedSignal(DataService::Server.Paths.Currencies.Coins).Connect([](int coins) {
	print(coins);
});
```

`GetChangedSignal` fires when that path (or a child) changes. Use a named function or a lambda (`[](int newValue) { ... }`).

## Rules

- Init on **server and client**. Writes that must persist belong on the server.
- Paths are not a C++ enum in the library. They exist because your Template was passed to `Init`.
- Keep boot (`Init`) in one file. Keep HUD / leaderstats in another and `WaitFor` there.

Full copies: [Data boot](../examples/data-boot.md), [Leaderstats](../examples/leaderstats.md), [HUD](../examples/hud.md).
