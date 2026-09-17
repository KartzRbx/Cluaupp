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
| `LeaderstatsServer.h` | **ModuleScript** (types) | — |
| `LeaderstatsServer.cpp` (sibling of `.h`) | **ModuleScript** (`*Impl`) | — |

## One file in, one file out

Rojo infers the instance from the filename key: `*.server.luau` is a Script, `*.client.luau` is a LocalScript, untagged `.luau` is a ModuleScript.

```
src/server/boot/DataBoot.server.cpp  →  out/server/boot/DataBoot.server.luau
src/client/boot/DataBoot.client.cpp  →  out/client/boot/DataBoot.client.luau
src/shared/damage.cpp                →  out/shared/Damage.luau
src/server/services/leaderstats/LeaderstatsServer.h   →  LeaderstatsServer.luau  (export type)
src/server/services/leaderstats/LeaderstatsServer.cpp →  LeaderstatsServerImpl.luau
```

`.legacy.server.cpp` still emits a Legacy Script (`boot.server.luau`). `.client.cpp` stays a LocalScript. Do not invent `init.meta.json` on the default 1:1 path.

## Where files live

```
src/server/.../*.server.cpp   → out/server  (ServerScriptService.Cluaupp)
src/client/.../*.client.cpp   → out/client  (StarterPlayerScripts.Cluaupp)
src/shared/.../*.cpp          → out/shared  (ReplicatedStorage.Cluaupp)
```

Name the **system**, not `init.server.cpp`. `LeaderstatsServer.server.cpp` and `DataBoot.server.cpp` are two files.

## Opt-in planner

`"architecture": true` in `cluaupp.config.json` restores PascalCase service folders (`Main`, Controller, Types). Default is off.
