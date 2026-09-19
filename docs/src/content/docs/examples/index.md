---
sidebar:
  order: 1
title: Examples
---

High-quality Cluaupp systems you can copy. Each page is a full service in **CL++**. Live sample: [`examples/game`](https://github.com/KartzRbx/Cluaupp/tree/main/examples/game). Language reference: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

These are **not** dumps of `int main()`. Entry is `void init()`. Types are `struct` + `Class::` methods. Canonical Leaderstats: [handbook](/examples/leaderstats/).

## Suggested layout

```
src/
  shared/PlayerData.clh
  shared/config.clp
  shared/features.clp
  server/leaderstats.server.clpp
  server/combat.server.clpp
  client/init.client.clpp
  client/hud.client.clpp
```

Boot DataService **once**. Other services `WaitFor` after that.

## Catalog

| Example | Teaches |
| --- | --- |
| [Data boot](/examples/data-boot/) | `Server.Init` / `Client.Init`, your Template, not `main()` |
| [Leaderstats](/examples/leaderstats/) | Folder `leaderstats`, FormatNumber, `GetChangedSignal`, per-player Janitor |
| [Combat (server validation)](/examples/combat/) | Client sends **intent**; server checks range, cooldown, health, then `TakeDamage` |
| [Shop](/examples/shop/) | `Net` buy remote, prices on the server, DataService debit |
| [HUD](/examples/hud/) | Client `WaitForData`, labels, Twinkle |
| [Sword / Touched](/examples/sword/) | Hitbox on the **server**, debounce, no client damage |

Read with [Libraries](/libraries/), [OOP structure](/language/oop/), and [Safety](/language/safety/).
