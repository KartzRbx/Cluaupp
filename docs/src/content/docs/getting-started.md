---
title: Getting started
description: Install clpp 0.8+, init a Cluaupp game, build, and serve with Rojo.
sidebar:
  order: 1
---

# Getting started

Cluaupp is the **Roblox project host**. [CL++](https://kartzrbx.github.io/CLPP/) is the **language**.

Language syntax on this site tracks **CL++ 0.8+** (`import`, Option/Result/`?`, opt hints). Prefer the [CL++ course](https://kartzrbx.github.io/CLPP/) as the live language law if anything here lags.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Rojo](https://rojo.space/) **7.7.0** (`cluaupp init` writes `rokit.toml`)
- **`clpp` 0.8.0+ on PATH** from [KartzRbx/CLPP releases](https://github.com/KartzRbx/CLPP/releases) (0.7.0 still accepted by the host binary until you upgrade — new syntax needs 0.8). Override with `CLPP` or `CLPP_PATH`.

```bash
clpp setup             # VS Code / Cursor language pack
```

## Install Cluaupp

```bash
npm install -g cluaupp@latest
cluaupp --version
```

Or:

```bash
npx cluaupp init my-game
```

## First game

```bash
cluaupp init my-game
cd my-game
rokit install
cluaupp build
rojo serve
```

```
my-game/
  cluaupp.config.json
  default.project.json
  src/
    ReplicatedStorage/Shared/...
    ServerScriptService/Boot/DataBoot.server.clpp
    ServerScriptService/Handlers/PlayerHandler.server.clpp
    ReplicatedStorage/Shared/Net/Net.flare
    StarterPlayer/...
  out/                    ← generated Luau (do not edit)
```

Context Safety runs on every compile: illegal `LocalPlayer` on the server fails the build. See [Context Safety](../architecture/context-safety/).

Useful platform commands after `init`:

```bash
cluaupp analyze              # doctor: DataModel, Parallel, Authority, Flare, …
cluaupp optimize             # advisor JSON
cluaupp optimize --apply --layout   # native + SoA modules (opt-in)
cluaupp docs                 # .cluaupp/PROJECT.md
cluaupp bridge               # Studio ↔ IDE (:3847) — keep running with CluauppNav
```

## Tiny program

```clpp
#include <clpp/roblox.clh>

void init() {
	Players players = GetService<Players>();
	post("online: " .: players.GetPlayers());
}
```

## Useful next steps

- [Why Cluaupp](../why-cluaupp/) — what competitors don’t have  
- [Benchmarks](../benchmarks/) — registry + build timings (reproducible)  
- [Option and Result](../language/option-result/) — `Ok`/`Err`/`?`  
- [Modules](../language/modules/) — `import { … } from`  
- [Cluaupp host](../architecture/cluaupp-host/) — `nativeHints` / `layoutHints`  
- [Roadmap](../roadmap/) — shipped vs later  
- [CLI](../cli/commands/) — `api`, `optimize`, `bridge`, `target doctor`  
- [Studio tools](../architecture/studio-tools/) — CluauppNav + IDE bridge  
- [Flare](../libraries/flare/) — remotes  
- Language course: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/)  
- Migrating older trees: [migration](../migration/)
