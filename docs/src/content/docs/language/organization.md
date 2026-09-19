---
title: Organization
---

A Cluaupp game is laid out like a roblox-ts project on disk. One tagged `.cpp` becomes one Luau instance (`leaderstats.server.luau`, `hud.client.luau`). See [Architecture](/internals/pipeline/).

```
src/
  server/     → Script (out/server)
  client/     → LocalScript (out/client)
  shared/     → ModuleScript (out/shared)
include/cluaupp/   IntelliSense
libs/              CluauppLibs (full Janitor, Fusion, Cmdr, DataService, …)
Packages/          extra Wally packages only
cluaupp.config.json
default.project.json
wally.toml
```

## Server / client / shared

| Folder | Runs on | Allowed to |
| --- | --- | --- |
| `src/server` | Server | DataStore, DataService writes, `Net:Fire` |
| `src/client` | Client | UI, Module3D, Twinkle, camera, `Net:FireServer` |
| `src/shared` | Both | types, `const` config, FormatNumber, MathUtils |

If a file needs `DataStoreService`, it is server. If it needs `UserInputService`, it is client. Shared code must compile in both.

## Headers vs scripts

- `.clh` in `src/` are inlined (`#include "config.h"`) and can hold `const` values and prototypes.
- `#include <clpp/...>` is IntelliSense only — never inlined. `cluaupp build` copies those headers into the game `include/` folder. Cursor/clangd also reads `compile_flags.txt`.

Keep config in `src/shared/config.h`:

```clpp
#pragma once
const int STARTING_COINS = 0;
const string REMOTE_COINS = "Coins";
```

## One module, one job

`leaderstats.server.clpp` creates leaderstats. It does not also open the shop UI. Name files after the system: `inventory.server.clpp`, `shop.client.clpp`.

`*.server.clpp` / `*.client.clpp` are **tags** (the same keys roblox-ts uses). Untagged `.cpp` is a ModuleScript. Set `"architecture": true` only if you want the old PascalCase folder split. See [Architecture](/internals/pipeline/) and [OOP structure](oop/index.md).

## CluauppLibs vs extra Wally

| Need | Where |
| --- | --- |
| Janitor, Promise, Fusion, Iris, Cmdr, TopbarPlus, Chrono, DataServiceV2, EzVisualz, StateMachine, Spring, Display, Module3D, FormatNumber, Net, MathUtils, Twinkle | `CluauppLibs` (copied on `cluaupp build` from GitHub-vendored `runtime/`) |
| Some other community package | `wally.toml` → `Packages` |

Do not install a second Janitor from Wally unless you have a reason — CluauppLibs already has howmanysmall/Janitor. DataServiceV2 still bundles its own janitor/quicknet/signal inside the DataService folder.

How-tos: [Libraries](libraries/index.md). Service layout: [OOP](oop/index.md). Copy-paste: [Examples](examples/index.md).

Next: [advanced Cluaupp](/language/advanced/).
