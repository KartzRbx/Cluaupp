---
title: Organization
sidebar_position: 13
---

# Organization

A Cluaupp game is laid out like a roblox-ts project on disk. The **output** is not a dump: `cluaupp build` turns each system into a PascalCase service folder (Main, Manager, Controller, Types). See [Architecture](architecture.md).

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

- `.h` / `.hpp` in `src/` are inlined (`#include "config.h"`) and can hold `const` values and prototypes.
- `#include <cluaupp/...>` is IntelliSense only — never inlined.

Keep config in `src/shared/config.h`:

```cpp
#pragma once
const int STARTING_COINS = 0;
const string REMOTE_COINS = "Coins";
```

## One module, one job

`leaderstats.server.cpp` creates leaderstats. It does not also open the shop UI. Name files after the system: `inventory.server.cpp`, `shop.client.cpp`.

`*.server.cpp` / `*.client.cpp` are **tags** (the same keys roblox-ts uses). Untagged `.cpp` is a ModuleScript. `.legacy.server.cpp` / `.legacy.client.cpp` skip the service split. See [Architecture](architecture.md).

## CluauppLibs vs extra Wally

| Need | Where |
| --- | --- |
| Janitor, Promise, Fusion, Iris, Cmdr, TopbarPlus, Chrono, DataServiceV2, EzVisualz, StateMachine, Spring, Display, Module3D, FormatNumber, Net, MathUtils, Twinkle | `CluauppLibs` (copied on `cluaupp build` from GitHub-vendored `runtime/`) |
| Some other community package | `wally.toml` → `Packages` |

Do not install a second Janitor from Wally unless you have a reason — CluauppLibs already has howmanysmall/Janitor. DataServiceV2 still bundles its own janitor/quicknet/signal inside the DataService folder.

Next: [advanced Cluaupp](cpp-advanced.md).
