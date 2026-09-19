---
title: Data boot
---

Start DataService **once** on the server and once on the client. Gameplay scripts (`leaderstats`, combat, shop) only `WaitFor` — they do not call `Init`.

The save **shape is yours**. Do not put `Currencies` on the library `DataPath` type. Put it on a shared struct and pass that as `.Template`.

## Shared template

`src/shared/constants/TemplateData.hpp`

```clpp
#pragma once

struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};
```

`src/server/configurations/PlayerDataVersion.hpp`

```clpp
#pragma once

const string PLAYER_DATA_VERSION = "PlayerData_v1";
```

Bump the store name when you **intentionally** wipe saves. Changing a field default in `TemplateData` does not migrate old profiles by itself.

## Server — `DataBoot.server.clpp`

Use `void init()`, not `int main()`. Cluaupp only auto-calls `init()`.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>
#include "../../shared/constants/TemplateData.hpp"
#include "../configurations/PlayerDataVersion.hpp"

void init() {
	TemplateData playerData = TemplateData {};
	DataService.Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = PLAYER_DATA_VERSION,
		.UseMock = true,
	});
}
```

| Field | In production |
| --- | --- |
| `.Template` | Same struct the rest of the game reads through `Paths` |
| `.StoreName` | Stable DataStore name (version it when you wipe) |
| `.UseMock` | `true` in Studio so you do not hit the live store |

After `Init`, `DataService.Server.Paths.Currencies.Money` exists because the Template had that table — not because the library shipped those fields.

## Client — `DataBoot.client.clpp`

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/dataservice.clh>

void init() {
	DataService.Client.Init();
}
```

Client `Init` has no Template. The server already owns the document.

## What other scripts do

```clpp
Data data = DataService.Server.WaitFor(player);
if (data == null) {
	return;
}

int money = data.Get(DataService.Server.Paths.Currencies.Money);
```

- Server gameplay: `WaitFor(player)` then `Get` / `Set`.
- Client HUD: `WaitForData()` then `Get`.
- Never `Init` twice. A second `Init` fights the first store.

## File tags

`DataBoot.server.clpp` → Script **RunContext Server** (`init.luau` + `init.meta.json`).  
`DataBoot.client.clpp` → LocalScript (`init.client.luau`).

See [file tags](/language/files/).
