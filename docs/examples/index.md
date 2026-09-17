---
title: Examples
sidebar_position: 1
---

# Examples

High-quality Cluaupp systems you can copy. Each page is a full service in **CL++**. Live sample: [`examples/game`](../../examples/game). Language reference: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

These are **not** dumps of `int main()`. Entry is `void init()`. Types are `struct` + `Class::` methods. Canonical Leaderstats: [handbook](https://kartzrbx.github.io/Cluaupp/docs/leaderstats.html).

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
| [Data boot](data-boot.md) | `Server.Init` / `Client.Init`, your Template, not `main()` |
| [Leaderstats](leaderstats.md) | Folder `leaderstats`, FormatNumber, `GetChangedSignal`, per-player Janitor |
| [Combat (server validation)](combat.md) | Client sends **intent**; server checks range, cooldown, health, then `TakeDamage` |
| [Shop](shop.md) | `Net` buy remote, prices on the server, DataService debit |
| [HUD](hud.md) | Client `WaitForData`, labels, Twinkle |
| [Sword / Touched](sword.md) | Hitbox on the **server**, debounce, no client damage |

Read with [Libraries](../libraries/index.md), [OOP structure](../oop/index.md), and [Safety](../cpp-safety.md).
