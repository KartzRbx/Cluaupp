---
title: Using libraries
sidebar_position: 1
---

# Libraries

`#include <cluaupp/libs/...hpp>` is IntelliSense. `cluaupp build` copies the real Luau into `libs/` (`ReplicatedStorage.CluauppLibs`). You do not `require` by hand in C++.

| Guide | Use it when |
| --- | --- |
| [DataService](dataservice.md) | Player save data, `Init`, `WaitFor`, `GetChangedSignal` |
| [Janitor](janitor.md) | Connections, instances, cleanup on leave |
| [Promise](promise.md) | Delay, Then / Catch / Await |
| [Net](net.md) | RemoteEvent / RemoteFunction without making remotes |
| [Declarative UI](ui.md) | Fusion, Iris, Vide, React/Roact — no JSX |
| [More libraries](more.md) | FormatNumber, Twinkle, TopbarPlus, EzVisualz, … |

Sources: [runtime/SOURCES.md](https://github.com/KartzRbx/Cluaupp/blob/main/runtime/SOURCES.md). Re-vendor: `node scripts/vendor-libs.js`.

Wally is optional. Do not install a second Janitor from Wally — CluauppLibs already has howmanysmall/Janitor.

Copy-paste systems: [Examples](../examples/index.md).
