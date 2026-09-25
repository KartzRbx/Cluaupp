---
sidebar:
  order: 4
title: File tags
---

The **filename** decides the Roblox instance (same idea as roblox-ts).

| Source | Instance |
| --- | --- |
| `LeaderstatsServer.server.clpp` | Script |
| `Hud.client.clpp` | LocalScript |
| `Tools.plugin.clpp` | Plugin Script |
| `damage.clp` (no tag) | ModuleScript |
| `PlayerData.clh` | ModuleScript |

```
Src/Server/Boot/DataBoot.server.clpp
  → out/Server/Boot/DataBoot.server.luau
Src/Client/Controllers/DataController.client.clpp
  → out/Client/Controllers/DataController.client.luau
Src/Include/GameTypes.clh
  → out/Include/GameTypes.luau
```

Language details: [CL++ docs](https://kartzrbx.github.io/CLPP/) (**0.8+**). Modules: prefer `import { … } from` — see [Modules](../modules/).
