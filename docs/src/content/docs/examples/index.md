---
sidebar:
  order: 1
title: Examples
---

High-quality Cluaupp systems you can copy. Each page is a full service in **CL++**. Live sample: [`examples/game`](https://github.com/KartzRbx/Cluaupp/tree/main/examples/game). Language reference: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

These are **not** dumps of `int main()`. Entry is `void init()`. Types are `struct` + `Class::` methods. Canonical Leaderstats: [handbook](leaderstats/).

## Suggested layout

```
Src/
  Include/GameTypes.clh
  Declarations/Net.flare
  Server/Boot/DataBoot.server.clpp
  Modules/Core/PlayerHandler.server.clpp
  Modules/Connection/Connection.server.clpp
  Client/Controllers/DataController.client.clpp
```

Boot Keep **once**. Other services `WaitFor` after that. Gameplay remotes live in `.flare`, not in [Net](../libraries/net/).

## Catalog

| Example | Teaches |
| --- | --- |
| [Data boot](data-boot/) | `Server.Init` / `Client.Init`, your Template, not `main()` |
| [Connection (Flare)](net/) | `.flare` Ready / Welcome / Session after Keep loads |
| [Leaderstats](leaderstats/) | Folder `leaderstats`, Mint, `GetChangedSignal`, per-player Sweep |
| [Combat (server validation)](combat/) | Client sends **intent**; server checks range, cooldown, health, then `TakeDamage` |
| [Shop](shop/) | Flare buy query, prices on the server, Keep debit |
| [HUD](hud/) | Gleam + Mint + Bloom |
| [NPC](npc/) | Shift FSM + Hive ECS |
| [Sword / Touched](sword/) | Hitbox on the **server**, debounce, no client damage |

Read with [Libraries](../libraries/), [OOP structure](../language/oop/), and [Safety](../language/safety/).
