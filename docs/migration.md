# Migrate C++ games to CL++

Cluaupp 1.0 compiles **CL++**, not a C++ subset. Language docs: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

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

| Old C++ subset | CL++ | Luau |
| --- | --- | --- |
| `player->Name` | `player.Name` | `.` |
| `player->GetPlayers()` | `player::GetPlayers()` | `:` |
| `players->PlayerAdded.Connect(fn)` | `players.PlayerAdded::Connect(fn)` | `.` then `:` |
| `DataService::Server` | `DataService:Server` | `.` |
| `"hi " + name` | `"hi " .: name` | `..` |
| `signal.Connect(fn)` | `signal::Connect(fn)` | `:` |
| `print` / `error` | `post` / `report` | `print` / `error` |
| `nullptr` | `null` | `nil` |
| `[](Player* p) { }` | `func (Player* p) { }` | `function` |

## Workflow

1. Install CL++: [github.com/KartzRbx/CLPP](https://github.com/KartzRbx/CLPP) (`cargo install --path .`).
2. `clpp install` (editor highlighting + IntelliSense).
3. Rename sources and apply the table above.
4. `cluaupp build` — `clpp` must be on PATH (`CLPP_PATH` if needed).

`"architecture": true` (ForeverHD folders) is not generated in 1.0. One source file still becomes one `.luau` file.
