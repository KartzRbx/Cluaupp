---
title: Organization
---

`cluaupp init` writes a **domain `Src/` tree**. Cluaupp builds Luau into `out/`, then generates `default.project.json` from that tree (GenRojoTree).

```
Src/
  Declarations/
    Net.flare
  Include/
    GameTypes.clh
    Core/
    Engine/
  Modules/
    Core/
      PlayerHandler.server.clpp
      Guard.server.clpp
  Client/
    Main.client.clpp
    Controllers/DataController.client.clpp
    UI/
  Server/
    Main.server.clpp
    Boot/DataBoot.server.clpp
    Services/
  Parallel/
libs/                 CluauppLibs (Keep, Sweep, Flare, …)
include/clpp/         IntelliSense
cluaupp.config.json
default.project.json
```

Rojo maps `libs/` to `ReplicatedStorage.CluauppLibs`. Game packages you add later go beside `Modules` / `Include`, not inside CluauppLibs.

## Where code runs

| Source folder | Runs on | Put here |
| --- | --- | --- |
| `Server/Boot` | Server | one-time init (`Keep.Server.Init`) |
| `Server/Services` | Server | long-lived server systems |
| `Client/Controllers` | Client | `Keep.Client.Init`, HUD controllers |
| `Client/UI` | Client | view layers |
| `Modules/**` | Depends on file tag | gameplay domains (`*.server` / `*.client` / module) |
| `Include/**` | Both | shared types and headers |
| `Declarations/**` | Both | `.flare` / schemas |

If a file needs `DataStoreService`, it is server. If it needs `UserInputService`, it is client. Shared must compile on both.

## Headers vs scripts

- Prefer **`import { Name } from "./GameTypes.clh"`** for language deps between CL++ files (CL++ 0.8+). There is no `export` keyword — top-level is importable.
- For project modules, use `import { ... } from "..."` (canonical require surface).
- `#include <clpp/...>` is IntelliSense / CluauppLibs — never a language module. `cluaupp build` copies those headers into the game `include/` folder.

Keep the save shape in `Src/Include/GameTypes.clh`.

## One module, one job

`Server/Boot/DataBoot.server.clpp` calls `Keep.Server.Init`. `Modules/Core/PlayerHandler.server.clpp` only `WaitFor`s. `Client/Controllers/DataController.client.clpp` calls `Keep.Client.Init`. Do not `Init` twice.

`*.server.clpp` / `*.client.clpp` are tags. Untagged `.clp` is a ModuleScript. `"architecture": true` is the old PascalCase folder split — leave it off.

## CluauppLibs

| Need | Where |
| --- | --- |
| Sweep, Spark, Keep, Flare, Mint, Axiom, Roster, Gleam, Bloom, Lens, Crest, Pin, Stage, Coil, Helm, Shift, Hive, Ember, Echo, Guide, Trace, Promise, Net | `CluauppLibs` |
| Something not in CluauppLibs | `wally.toml` → extra Packages |

Do not install a second janitor or ProfileStore. `CluauppLibs.Sweep` is the zelador. `CluauppLibs.Keep` is the session-locked store (trades included).

How-tos: [Libraries](../../libraries/). Copy-paste: [Examples](../../examples/).
