---
title: Migration
description: Move from older C++-style trees or CL++ 0.3.x to CL++ 0.7+ with Cluaupp.
sidebar:
  order: 5
---

# Migration

Cluaupp targets **CL++ 0.7.0+**, not a C++ subset and not the old 0.3.x compiler. Language course: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

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

## Operators and IO

| Old C++ subset | CL++ 0.7+ | Luau |
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

## Workflow

1. Install CL++ **0.7.0+**: [github.com/KartzRbx/CLPP/releases](https://github.com/KartzRbx/CLPP/releases). `cluaupp language` must print **0.7.x** (not 0.3.x / 0.1.0).
2. `clpp setup` (editor highlighting + IntelliSense).
3. Rename sources and apply the table above.
4. `cluaupp build` — Context Safety runs before `clpp`; illegal server/client APIs fail the build.
5. Optional: `cluaupp api generate` / `api verify` to refresh the Roblox registry.

`"architecture": true` (ForeverHD folders) is not generated. One source file still becomes one `.luau` file.

## From CL++ 0.3.x

Keep the same file tags and operators. Upgrade the **`clpp` binary** first — older compilers cannot parse 0.7 language features that Cluaupp expects. Then rebuild; fix any new Context Safety diagnostics (for example `LocalPlayer` on a `.server.clpp`).

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

Next: [Getting started](../getting-started/) · [Why Cluaupp](../why-cluaupp/) · [Context Safety](../architecture/context-safety/).
