---
title: Examples
sidebar_position: 1
---

# Examples

High-quality Cluaupp systems you can copy. Each page is a full service: C++ that the subset actually compiles, server authority, Janitor cleanup, and the file names Studio expects.

These are **not** dumps of `int main()`. Entry is `void init()`. There are no lambdas and no custom C++ classes — named functions + structs.

## Suggested layout

```
src/
  shared/constants/TemplateData.hpp
  shared/constants/CombatConfig.hpp
  shared/constants/ShopCatalog.hpp
  server/boot/DataBoot.server.cpp
  client/boot/DataBoot.client.cpp
  server/services/leaderstats/LeaderstatsServer.server.cpp
  server/services/combat/CombatServer.server.cpp
  client/controllers/combat/CombatClient.client.cpp
  server/services/shop/ShopServer.server.cpp
  client/controllers/shop/ShopClient.client.cpp
  client/controllers/hud/HudClient.client.cpp
  server/services/weapons/SwordServer.server.cpp
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
