---
title: File tags
sidebar_position: 2
---

# File tags

The **filename** decides the Roblox instance. This is the same key idea as roblox-ts (`*.server.ts` → Script).

| Source | Instance | RunContext |
| --- | --- | --- |
| `LeaderstatsServer.server.cpp` | **Script** | **Server** |
| `DataBoot.client.cpp` | **LocalScript** | Client |
| `Tools.plugin.cpp` | **Script** | Plugin |
| `Boot.legacy.cpp` | Script | **Legacy** |
| `Boot.legacy.server.cpp` | Script | **Legacy** |
| `Boot.legacy.client.cpp` | LocalScript | Legacy |
| `Damage.cpp` (no tag) | **ModuleScript** | — |

## Server is not Legacy

`.server.cpp` is **not** `init.server.luau`. Rojo maps `*.server.luau` to a Script with RunContext **Legacy**. Cluaupp emits:

```
out/server/LeaderstatsServer/
  init.luau
  init.meta.json    -- className Script, RunContext Server
```

`.legacy.server.cpp` is the 1:1 dump that *does* become Legacy.

`.client.cpp` stays `init.client.luau` (LocalScript). Do not add `init.meta.json` on the client boot.

## Where files live

```
src/server/.../*.server.cpp   → out/server  (ServerScriptService)
src/client/.../*.client.cpp   → out/client  (StarterPlayerScripts)
src/shared/.../*.cpp          → out/shared  (ReplicatedStorage)
```

Name the **system**, not `init.server.cpp`. `LeaderstatsServer.server.cpp` and `DataBoot.server.cpp` are two services.

## Skip the planner

- `"architecture": false` in `cluaupp.config.json`, or
- `.legacy.server.cpp` / `.legacy.client.cpp` per file

Use legacy only when you want one Luau file with no Main / Controller split.
