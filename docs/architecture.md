---
title: Architecture
sidebar_position: 15
---

# Output treated as a Roblox system

roblox-ts decides **what instance you get** from a filename **key** (the same idea as Rojo):

| Key | Rojo instance |
| --- | --- |
| `*.server.ts` | Script |
| `*.client.ts` | LocalScript |
| no suffix | ModuleScript |

Flamework then stamps a second key (`@Service` / `@Controller`) so the runtime knows the **role**. Cluaupp does both steps without decorators.

1. **Tag** (filename) — where the code runs and whether it is a Script, LocalScript, ModuleScript, or a 1:1 “legacy” dump.
2. **Intent** (AST) — what the code *is for*: players, cache, combat, input, UI, net, data, … scored from APIs and identifiers, the same idea as intent classification in program analysis (features from the tree, not a 200-line dump).

Leaderstats was the example. A combat `.server.cpp` is a different system and gets Combat folders, not a fake CacheController.

## File tags

| Source | Meaning | Output |
| --- | --- | --- |
| `combat.server.cpp` | **Script** | `Combat/init.server.luau` |
| `hud.client.cpp` | **LocalScript** | `Hud/init.client.luau` |
| `tools.plugin.cpp` | **Script** RunContext Plugin | `Tools/init.luau` + `init.meta.json` |
| `boot.legacy.cpp` | Legacy Script | `boot.server.luau` |
| `boot.legacy.server.cpp` | Legacy Script | `boot.server.luau` |
| `boot.legacy.client.cpp` | Legacy LocalScript | `boot.client.luau` |
| `boot.legacy.plugin.cpp` | Plugin | `boot.luau` + Plugin meta |
| `damage.cpp` (no tag) | **ModuleScript** | `Damage.luau` |

Trivial entry files (`init.client.cpp` that only `print`) stay a single LocalScript (`init.client.luau`). The planner does not invent Managers for a hello-world.

## How the planner reasons

```
filename key  →  server | client | module | legacy
AST features  →  GetService, Instance.new, methods, identifiers
intent scores →  combat:2, character:1, …
roles         →  Main + Managers + Controllers + Types
user functions→  kept in the matching Controller (not discarded)
```

Generated files start with that trace:

```luau
-- tag server → Script (service)
-- intents combat:2, character:1
-- roles Main, CombatController, CombatTypes
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

If the C++ creates Coins/Level, CacheController is generated (higher quality than copying `CreateLeaderstats`). Combat logic is **not** rewritten into leaderstats — `ApplyDamage` stays in `CombatController.luau`.

The domain controller keeps **every** user function. CacheController is generated beside it; it must not delete `SetupPlayerManager` while `init` still calls that name. `GetChangedSignal(Paths.Currencies)` stays in `DataController`.

## What leaderstats becomes

```
src/server/leaderstats.server.cpp
```

```
out/server/LeaderStats/
  init.server.luau
  Main.luau
  PlayersManager.luau
  CacheController.luau
  LeaderStatsTypes.luau
```

## What combat becomes

```
src/server/combat.server.cpp   -- TakeDamage, Humanoid
```

```
out/server/Combat/
  init.server.luau
  Main.luau
  CombatController.luau    -- your ApplyDamage / OnHit
  CombatTypes.luau
```

No PlayersManager unless you actually listen to players. No CacheController unless you actually create value Instances.

## ForeverHD-style rules

- PascalCase folders and modules; camelCase locals
- `--!strict` everywhere
- Public API `Start` / `Stop`
- Janitor owns connections in the Manager
- Types modules `return {}`
- Transparent `require(script.Parent.X)`

## Config

`cluaupp.config.json`: `"architecture": true` (default). `"architecture": false` forces 1:1 dumps (or use `.legacy.server.cpp` / `.legacy.client.cpp` per file).

See [organization](cpp-organization.md) and [comparison](comparison.md).
