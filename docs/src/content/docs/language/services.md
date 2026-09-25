---
title: Services
description: GetService is a Cluaupp Roblox Target feature — registry, Context Safety, and headers.
---

# Services

**`GetService<T>()` is Cluaupp’s responsibility**, not a CL++ language primitive.

CL++ only parses a generic call (`GetService<Players>()` → Call + type args). Cluaupp owns:

| Layer | Behavior |
| --- | --- |
| Canonical Registry | Which names are services (`resolveGetServiceType`) |
| Headers | `#include <clpp/roblox.clh>` declares `template <typename T> T GetService()` |
| Context Safety | Illegal services per `.server` / `.client` / `.plugin` |
| Build check | Unknown service → **`CLUAU_SVC001`** |
| Postprocess | Normalize leftover `GetService<…>()` → `game:GetService("…")` |

See [Cluaupp host](../../architecture/cluaupp-host/) · [Roblox Target](../../architecture/roblox-target/) · [Context Safety](../../architecture/context-safety/).

## Scripts = one system per tagged file

Cluaupp emits **one** Luau instance: `LeaderstatsServer.server.luau` from `LeaderstatsServer.server.clpp`. It does not invent Main / Controller / Types unless `"architecture": true`.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>
#include <clpp/libs/keep.clh>

void SetupPlayerManager(Player player) {
	Data data = Keep.Server.WaitFor(player);
	if (data == null) {
		return;
	}
}

void init() {
	Players players = GetService<Players>();
	players.PlayerAdded~>Connect(SetupPlayerManager);
}
```

```
out/Modules/Handlers/LeaderstatsServer.server.luau
```

`init()` runs at the end. Prefer the typed form `GetService<Players>()` over stringly `GetService("Players")`.

## Lifecycle

You own `init` and Sweep cleanup in the same file. Name the **file** `LeaderstatsServer.server.clpp` and keep **functions** as the public API.

## Boot vs gameplay

Keep `Keep.Server.Init` in `DataBoot.server.clpp`. Keep `Keep.Client.Init` in `DataController.client.clpp`. Handlers `WaitFor` after boot has run.

Copy-paste: [Examples](../../examples/).
