---
sidebar:
  order: 1
title: Using libraries
---

`#include <clpp/libs/….clh>` is IntelliSense. `cluaupp build` copies the real Luau into `libs/` (`ReplicatedStorage.CluauppLibs`). You do not `require` by hand in CL++.

| Guide | Use it when |
| --- | --- |
| [DataService](/libraries/dataservice/) | Player save data, `Init`, `WaitFor`, `GetChangedSignal` |
| [Janitor](/libraries/janitor/) | Connections, instances, cleanup on leave |
| [Promise](/libraries/promise/) | Delay, Then / Catch / Await |
| [Net](/libraries/net/) | RemoteEvent / RemoteFunction without making remotes |
| [Declarative UI](/libraries/ui/) | Fusion, Iris, Vide, React/Roact — no JSX |
| [More libraries](/libraries/more/) | FormatNumber, Twinkle, TopbarPlus, EzVisualz, … |

Sources: [runtime/SOURCES.md](https://github.com/KartzRbx/Cluaupp/blob/main/runtime/SOURCES.md). Re-vendor: `node scripts/vendor-libs.js`.

Wally is optional. Do not install a second Janitor from Wally — CluauppLibs already has howmanysmall/Janitor.

Copy-paste systems: [Examples](/examples/).
