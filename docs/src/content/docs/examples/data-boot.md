---
title: Data boot
---

Start Keep **once** on the server and once on the client. `cluaupp init` already ships this: `Src/Server/Boot/DataBoot.server.clpp` and `Src/Client/Controllers/DataController.client.clpp`.

Gameplay scripts (`PlayerHandler`, combat, shop) only `WaitFor` — they do not call `Init`.

The save **shape is yours**. It lives in `Src/Include/GameTypes.clh`.

## Shared template

`Src/Include/GameTypes.clh`

```clpp
#pragma once

struct Currencies {
	int Coins = 0;
	int Gems = 0;
};

struct PlayerTemplate {
	Currencies Currencies;
	int Rebirths = 0;
	int Rank = 0;
};

extern PlayerTemplate TemplateData;
```

Bump `.StoreName` when you **intentionally** wipe saves. Changing a field default in `TemplateData` reconciles missing keys; it does not migrate old values.

## Server — `DataBoot.server.clpp`

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/keep.clh>
import { PlayerTemplate } from "../../Include/GameTypes.clh";

void init() {
	PlayerTemplate playerData = PlayerTemplate();
	Keep.Server.Init(DataServiceOptions {
		.Template = playerData,
		.StoreName = "PlayerData",
		.UseMock = true,
	});
}
```

| Field | In production |
| --- | --- |
| `.Template` | Same struct the rest of the game reads through `Paths` |
| `.StoreName` | Stable DataStore name (version it when you wipe) |
| `.UseMock` | `true` in Studio so you do not hit the live store |

After `Init`, `Keep.Server.Paths.Currencies.Coins` exists because the Template had that table.

## Client — `DataController.client.clpp`

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/keep.clh>

void init() {
	Keep.Client.Init();
}
```

Client `Init` has no Template. The server already owns the document.

## What other scripts do

```clpp
Data data = Keep.Server.WaitFor(player);
int coins = data.Get(Keep.Server.Paths.Currencies.Coins);
```

- Server gameplay: `WaitFor(player)` then `Get` / `Set`.
- Client HUD: `WaitForData()` then `Get`.
- Trades: `Keep.Trade.Begin` / `Reserve` / `Commit` on server profiles only.
- Never `Init` twice.

See [Keep](../../libraries/keep/) and [file tags](../../language/files/).
