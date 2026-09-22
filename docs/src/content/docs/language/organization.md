---
title: Organization
---

`cluaupp init` writes a Roblox service tree. Source folders map 1:1 to live services (`out/ServerScriptService` → ServerScriptService). There is no `src/server`, `src/shared`, or `src/client`.

```
src/
  ReplicatedFirst/Loading/
  ReplicatedStorage/
    Shared/
      Constants/
        Classes/
        Primitives/
        Datas/TemplateData.clh
      Services/
      Modules/
      Utils/
      Types/
      Net/
  ServerScriptService/
    Boot/DataBoot.server.clpp
    Configuration/
    Handlers/PlayerHandler.server.clpp
    Services/
  StarterPlayer/
    StarterPlayerScripts/
      Controllers/DataController.client.clpp
      UI/
      Input/
    StarterCharacterScripts/
      Character/
      Movement/
      Combat/
  ServerStorage/
    Configuration/
    Modules/
libs/                 CluauppLibs (Keep, Sweep, Flare, …)
include/clpp/         IntelliSense
cluaupp.config.json
default.project.json
```

Rojo maps `libs/` to `ReplicatedStorage.CluauppLibs`. Game packages you add later go beside Shared, not inside CluauppLibs.

## Where code runs

| Folder | Runs on | Put here |
| --- | --- | --- |
| `ServerScriptService/Boot` | Server | `Keep.Server.Init` once |
| `ServerScriptService/Handlers` | Server | PlayerAdded, leaderstats, combat |
| `ServerScriptService/Services` | Server | long-lived server systems |
| `ServerScriptService/Configuration` | Server | store names, feature flags |
| `ReplicatedStorage/Shared` | Both | TemplateData, types, utils, Flare schemas |
| `StarterPlayerScripts/Controllers` | Client | `Keep.Client.Init`, HUD controllers |
| `StarterPlayerScripts/UI` / `Input` | Client | Gleam, user input |
| `StarterCharacterScripts` | Character | movement, combat locals |
| `ServerStorage` | Server | secrets, unpublished modules |
| `ReplicatedFirst` | First | loading UI |

If a file needs `DataStoreService`, it is server. If it needs `UserInputService`, it is client. Shared must compile on both.

## Headers vs scripts

- Prefer **`import { Name } from "./TemplateData.clh"`** for language deps between CL++ files (CL++ 0.8+). There is no `export` keyword — top-level is importable.
- Quoted `#include "….clh"` remains for header/impl splice (same stem) and legacy trees.
- `#include <clpp/...>` is IntelliSense / CluauppLibs — never a language module. `cluaupp build` copies those headers into the game `include/` folder.

Keep the save shape in `Shared/Constants/Datas/TemplateData.clh`. Paths exist only because that template has those fields.

## One module, one job

`DataBoot.server.clpp` calls `Keep.Server.Init`. `PlayerHandler.server.clpp` only `WaitFor`s. `DataController.client.clpp` calls `Keep.Client.Init`. Do not `Init` twice.

`*.server.clpp` / `*.client.clpp` are tags. Untagged `.clp` is a ModuleScript. `"architecture": true` is the old PascalCase folder split — leave it off.

## CluauppLibs

| Need | Where |
| --- | --- |
| Sweep, Spark, Keep, Flare, Mint, Axiom, Roster, Gleam, Bloom, Lens, Crest, Pin, Stage, Coil, Helm, Shift, Hive, Ember, Echo, Guide, Trace, Promise, Net | `CluauppLibs` |
| Something not in CluauppLibs | `wally.toml` → extra Packages |

Do not install a second janitor or ProfileStore. `CluauppLibs.Sweep` is the zelador. `CluauppLibs.Keep` is the session-locked store (trades included).

How-tos: [Libraries](../../libraries/). Copy-paste: [Examples](../../examples/).
