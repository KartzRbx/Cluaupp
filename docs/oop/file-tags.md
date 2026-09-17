---
title: File tags
sidebar_position: 2
---

# File tags

The **filename** decides the Roblox instance (same idea as roblox-ts).

| Source | Instance |
| --- | --- |
| `LeaderstatsServer.server.clpp` | Script |
| `Hud.client.clpp` | LocalScript |
| `Tools.plugin.clpp` | Plugin Script |
| `damage.clp` (no tag) | ModuleScript |
| `PlayerData.clh` | ModuleScript |

```
src/server/boot/DataBoot.server.clpp  →  out/server/boot/DataBoot.server.luau
src/client/hud.client.clpp            →  out/client/hud.client.luau
src/shared/config.clp                 →  out/shared/config.luau
```

Language details: [CL++ docs](https://kartzrbx.github.io/CLPP/).
