---
title: Migration
description: Move from older C++-style trees or CL++ 0.3/0.7 to CL++ 0.8+ with Cluaupp.
sidebar:
  order: 5
---

# Migration

Cluaupp targets **CL++ 0.8+** language docs (Option/Result, canonical `import`). Host still accepts **0.7.0+** binaries until you upgrade. Language course: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

## Files

| Before | After |
| --- | --- |
| `*.server.cpp` | `*.server.clpp` |
| `*.client.cpp` | `*.client.clpp` |
| untagged `*.cpp` | `*.clp` |
| `*.h` / `*.hpp` | `*.clh` |

`#include <cluaupp/roblox.hpp>` → `#include <clpp/roblox.clh>`  
`#include <cluaupp/libs/janitor.hpp>` → `#include <clpp/libs/sweep.clh>`  
Quoted includes: `"leaderstats.h"` → `"leaderstats.clh"`.

## Modules (0.7 → 0.8)

| Before | After |
| --- | --- |
| `#include "PlayerData.clh"` as the only module form | Prefer `import { PlayerData } from "./PlayerData.clh"` |
| Imagined `export` keyword | **None** — top-level is importable |
| Angle `#include <clpp/…>` | Still host prelude only |

Cycles between `import`s fail with **CLPP1001**.

## Option / Result (new in 0.8)

| Pattern | Use |
| --- | --- |
| Recoverable error | `Result<T, E>` + `Ok` / `Err` + `?` or `match` |
| Absence | `optional<T>` / `Some` / `None` |
| Assign Result → plain `T` | **CLPP0202** — unwrap first |
| `?` on non-Result | **CLPP1101** |
| Non-exhaustive Option/Result match | **CLPP1102** |

See [Option and Result](../language/option-result/).

## Operators and IO

| Old C++ subset | CL++ 0.8+ | Luau |
| --- | --- | --- |
| `player->Name` | `player.Name` | `.` |
| `player->GetPlayers()` | `player.GetPlayers()` | `:` |
| `Player player` | `Player player` | `Player` |
| `players->PlayerAdded.Connect(fn)` | `players.PlayerAdded~>Connect(fn)` | Sweep `Connect` |
| `DataService::Server` | `Keep.Server` | `.` |
| `"hi " + name` | `"hi " .: name` | `..` |
| `signal.Connect(fn)` | `signal~>Connect(fn)` (or `::Connect` if you Disconnect) | `:` |
| `OnHit.Fire` | `OnHit.Fire` | `:Fire` |
| `print` / `error` | `post` / `report` | `print` / `error` |
| `nullptr` | `null` | `nil` |
| `[](Player p) { }` | `func (Player p) { }` | `function` |
| `for (T* x : list)` | `for (T x in list)` | `for _, x in list` |
| `this->janitor` | `@janitor` inside `Class::Method` | `self.janitor` |
| C++ exceptions | `Result` + `?` or `pcall` | tagged / `pcall` |

## Workflow

1. Install CL++ **0.8.0+** when available: [github.com/KartzRbx/CLPP/releases](https://github.com/KartzRbx/CLPP/releases). `cluaupp language` should print a modern **0.7.x / 0.8.x** (not 0.3.x / 0.1.0).
2. `clpp setup` (editor highlighting + IntelliSense).
3. Rename sources and apply the tables above; migrate module deps to `import`.
4. `cluaupp build` — Context Safety runs before `clpp`; illegal server/client APIs fail the build.
5. Optional: `cluaupp api generate` / `api verify` to refresh the Roblox registry.

`"architecture": true` (ForeverHD folders) is not generated. One source file still becomes one `.luau` file.

## From CL++ 0.3.x / 0.7.x

Keep the same file tags and operators. Upgrade the **`clpp` binary** first — older compilers cannot parse 0.8 language features. Then rebuild; fix Context Safety diagnostics and any new `CLPP0202` / `CLPP1101` / `CLPP1102` / `CLPP1001`.

## Wally require → native include

| Wally / old | Include | Runtime |
| --- | --- | --- |
| `require(Janitor)` | `#include <clpp/libs/sweep.clh>` | `CluauppLibs.Sweep` |
| `require(Signal)` | `#include <clpp/libs/spark.clh>` | `CluauppLibs.Spark` |
| `require(DataService)` | `#include <clpp/libs/keep.clh>` | `CluauppLibs.Keep` |
| `require(QuickNet)` | `.flare` schema + `#include "Net.clh"` | `CluauppLibs.Flare` |
| `require(Fusion)` | `#include <clpp/libs/gleam.clh>` | `CluauppLibs.Gleam` |
| `require(Iris)` | `#include <clpp/libs/lens.clh>` | `CluauppLibs.Lens` |
| `require(Cmdr)` | `#include <clpp/libs/helm.clh>` | `CluauppLibs.Helm` |
| `require(FormatNumber)` | `#include <clpp/libs/mint.clh>` | `CluauppLibs.Mint` |
| `require(EzVisualz)` / Twinkle | `#include <clpp/libs/bloom.clh>` | `CluauppLibs.Bloom` |
| `require(RobloxStateMachine)` | `.shift` + `#include <clpp/libs/shift.clh>` | `CluauppLibs.Shift` |
| jecs | `.hive` + `#include <clpp/libs/hive.clh>` | `CluauppLibs.Hive` |

Old headers are gone. Buffer law: no JSON on the hot path. `~>` Connect is Sweep.

Next: [Getting started](../getting-started/) · [Modules](../language/modules/) · [Why Cluaupp](../why-cluaupp/) · [Context Safety](../architecture/context-safety/).
