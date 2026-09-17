---
title: Architecture
sidebar_position: 15
---

# One file in, one file out

roblox-ts decides **what instance you get** from a filename **key**. Cluaupp does the same for **CL++**.

| Key | Rojo instance | Default output |
| --- | --- | --- |
| `*.server.clpp` | Script | `*.server.luau` |
| `*.client.clpp` | LocalScript | `*.client.luau` |
| `*.plugin.clpp` | Plugin Script | `*.plugin.luau` |
| `.clp` / untagged `.clpp` | ModuleScript | `Name.luau` |
| `.clh` | ModuleScript | `Name.luau` |

```
src/server/leaderstats.server.clpp  →  out/server/leaderstats.server.luau
src/client/hud.client.clpp          →  out/client/hud.client.luau
src/shared/config.clp               →  out/shared/config.luau
src/shared/PlayerData.clh           →  out/shared/PlayerData.luau
```

`"architecture": true` (ForeverHD `Main` / Managers folders) is **not** generated in Cluaupp 1.0. `clpp` compiles each file; this CLI maps libraries and writes `out/`.

`--!strict` is opt-in: `#pragma strict` or `"strict": true` in `cluaupp.config.json`.

Language: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/). File tags: [OOP](oop/file-tags.md).
