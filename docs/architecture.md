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

## SystemUnderstander

Like [roblox-ts](https://github.com/roblox-ts/roblox-ts) (filename **key** first) and [roblox-cs](https://github.com/roblox-csharp/roblox-cs) (scan the AST, then decide), Cluaupp does **not** call a generative model. `src/system-understander.ts` walks the Tree-sitter tree, scores token density against Roblox engine services, and returns a report the emitter may stamp as comments / extra `GetService` lines.

| Step | What happens |
| --- | --- |
| `parseFileTag` | `.server.cpp` → Script / Server, `.client.cpp` → LocalScript / Client, no tag → ModuleScript |
| `namesIn` | identifiers, `GetService<T>`, `new Class`, string literals |
| `scoreIntents` | evidence count × side weight (server tokens count more on `.server.cpp`) |
| `determineArchitecture` | score &lt; 2 → utility Module; otherwise Knit-style Controller / Manager / Service. `players` / `cache` stay supporting if combat, UI, or net already has ≥ 2 tokens |

The **Rojo class never changes** because of a role. A HUD LocalScript can be classified as `ViewController` and still emit `hud.client.luau`. Sample sources: [examples/game](../examples/game).

## Compiler pipeline

Cluaupp does not rewrite C++ as text. The CLI parses a Tree-sitter CST, collects symbols (`GetService<T>()`, `#include`, types, constants), then emits Luau in a fixed order:

1. `game:GetService(...)`
2. `require(...)` (Rojo `default.project.json` when present)
3. types
4. constants
5. functions / script body

Formatting is delegated to StyLua; type sanity to `luau-analyze`. See [CLI](cli.md).

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

Set `"architecture": true` in `cluaupp.config.json` to restore the old planner: PascalCase service folders, `Main` / Managers / Controllers / Types, and `require(script.Main):Start()`. Server folders emit `init.server.luau` plus a **pure JSON** `init.meta.json` with only `RunContext.Server` — never `className`, and never library `require` lines (Rojo 7.7 rejects both).

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
