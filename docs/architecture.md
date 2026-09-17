---
title: Architecture
sidebar_position: 15
---

# One file in, one file out

roblox-ts decides **what instance you get** from a filename **key** (the same idea as Rojo). Cluaupp does the same — and **stops there** by default. It does not invent Main / Controller / Types folders.

| Key | Rojo instance | Default output |
| --- | --- | --- |
| `*.server.cpp` | Script | `*.server.luau` |
| `*.client.cpp` | LocalScript | `*.client.luau` |
| no suffix | ModuleScript | `Name.luau` |
| `*.legacy.server.cpp` | Legacy Script | `*.server.luau` |

`DataBoot.client.cpp` becomes `out/client/boot/DataBoot.client.luau` with your `init()` at the end. Shared `#include` modules use `require(ReplicatedStorage.Cluaupp...)`.

`--!strict` is opt-in: put `#pragma strict` in the `.cpp`, or set `"strict": true` in `cluaupp.config.json`.

The ForeverHD-style folder split (`LeaderStats/Main.luau`, …) is **opt-in**: `"architecture": true`.

## File tags

| Source | Meaning | Output |
| --- | --- | --- |
| `combat.server.cpp` | **Script** | `combat.server.luau` |
| `hud.client.cpp` | **LocalScript** | `hud.client.luau` |
| `tools.plugin.cpp` | **Script** RunContext Plugin | `tools.luau` (legacy plugin tag) |
| `boot.legacy.server.cpp` | Legacy Script | `boot.server.luau` |
| `damage.cpp` (no tag) | **ModuleScript** | `Damage.luau` |

## What a tagged file becomes

```
src/server/leaderstats.server.cpp  →  out/server/leaderstats.server.luau
src/client/boot/DataBoot.client.cpp  →  out/client/boot/DataBoot.client.luau
src/shared/damage.cpp  →  out/shared/Damage.luau
```

Scripts and LocalScripts keep your functions and call `init()` at the end. ModuleScripts return a table. There is no invented Main, Controller, or Types file.

## Opt-in: ForeverHD folders (`"architecture": true`)

Set `"architecture": true` in `cluaupp.config.json` to restore the old planner: PascalCase service folders, `Main` / Managers / Controllers / Types, and `require(script.Main):Start()`.

```
filename key  →  server | client | module | legacy
AST features  →  GetService, Instance.new, methods, identifiers
intent scores →  combat:2, character:1, …
roles         →  Main + Managers + Controllers + Types
```

| Evidence in the C++ | Role |
| --- | --- |
| `PlayerAdded`, `GetPlayers` | `PlayersManager` (Janitor) |
| `Folder` + `IntValue` / `StringValue` | `CacheController` |
| `TakeDamage`, `Humanoid`, `Raycast` | `CombatController` (your functions) |
| `UserInputService`, `InputBegan` | `InputController` |
| `RemoteEvent`, `Net` | `NetController` |
| `DataStore`, `DataService` | `DataController` |
| Domain shapes / stats | `{Service}Types` (`export type`, `return {}`) |
| Wiring | `Main.Start` / `Main.Stop` |

Switching back to 1:1 deletes the stale `LeaderStats/` / `DataBoot/` folders on the next `cluaupp build`.

How to **write** a system, tags, and module-style OOP: [OOP structure](oop/index.md). Copy-paste systems: [Examples](examples/index.md). Also [organization](cpp-organization.md) and [comparison](comparison.md).
