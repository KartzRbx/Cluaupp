---
title: Migration
---

Cluaupp compiles **CL++ 0.3.2**, not a C++ subset. Language: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

## Files

| Before | After |
| --- | --- |
| `*.server.cpp` | `*.server.clpp` |
| `*.client.cpp` | `*.client.clpp` |
| untagged `*.cpp` | `*.clp` |
| `*.h` / `*.hpp` | `*.clh` |

`#include <cluaupp/roblox.hpp>` → `#include <clpp/roblox.clh>`  
`#include <cluaupp/libs/janitor.hpp>` → `#include <clpp/libs/janitor.clh>`  
Quoted includes: `"leaderstats.h"` → `"leaderstats.clh"`.

## Operators and IO

| Old C++ subset | CL++ 0.3.2 | Luau |
| --- | --- | --- |
| `player->Name` | `player.Name` | `.` |
| `player->GetPlayers()` | `player.GetPlayers()` | `:` |
| `Player player` | `Player player` | `Player` |
| `players->PlayerAdded.Connect(fn)` | `players.PlayerAdded~>Connect(fn)` | Janitor `Connect` |
| `DataService::Server` | `DataService.Server` | `.` |
| `"hi " + name` | `"hi " .: name` | `..` |
| `signal.Connect(fn)` | `signal~>Connect(fn)` (or `::Connect` if you Disconnect) | `:` |
| `OnHit.Fire` | `OnHit.Fire` | `:Fire` |
| `print` / `error` | `post` / `report` | `print` / `error` |
| `nullptr` | `null` | `nil` |
| `[](Player p) { }` | `func (Player p) { }` | `function` |
| `for (T* x : list)` | `for (T x in list)` | `for _, x in list` |
| `this->janitor` | `@janitor` inside `Class::Method` | `self.janitor` |

## Workflow

1. Install CL++ **0.3.2**: [github.com/KartzRbx/CLPP/releases/tag/v0.3.2](https://github.com/KartzRbx/CLPP/releases/tag/v0.3.2). `cluaupp language` must print 0.3.2.
2. `clpp setup` (editor highlighting + IntelliSense).
3. Rename sources and apply the table above.
4. `cluaupp build` — `clpp` on PATH (`CLPP` / `CLPP_PATH` if needed).

`"architecture": true` (ForeverHD folders) is not generated in 1.0. One source file still becomes one `.luau` file.
