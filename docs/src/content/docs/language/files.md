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
src/ServerScriptService/Boot/DataBoot.server.clpp
  → out/ServerScriptService/Boot/DataBoot.server.luau
src/StarterPlayer/StarterPlayerScripts/Controllers/DataController.client.clpp
  → out/StarterPlayer/StarterPlayerScripts/Controllers/DataController.client.luau
src/ReplicatedStorage/Shared/Constants/Datas/TemplateData.clh
  → out/ReplicatedStorage/Shared/Constants/Datas/TemplateData.luau
```

Language details: [CL++ docs](https://kartzrbx.github.io/CLPP/).
