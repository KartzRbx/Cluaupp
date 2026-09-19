---
title: Getting started
---

Cluaupp is the **game toolchain**. [CL++](https://kartzrbx.github.io/CLPP/) is the **language**.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Rojo](https://rojo.space/) **7.7.0** (`cluaupp init` writes `rokit.toml`)
- **`clpp` 0.3.2 on PATH** from [KartzRbx/CLPP](https://github.com/KartzRbx/CLPP/releases/tag/v0.3.2) (`clpp-setup.exe` then `clpp setup`). Override with `CLPP` or `CLPP_PATH`.

```bash
cargo install --path .   # inside a CL++ checkout
clpp setup             # VS Code / Cursor language pack
```

## Install Cluaupp

```bash
npm install -g cluaupp@latest
cluaupp --version
```

Need **1.4.0+**. A leftover global **1.3.0** still writes `src/server` / `src/client` / `src/shared`. Upgrade, then `init` into a **new** folder.

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
    ReplicatedStorage/Shared/Constants/Datas/TemplateData.clh
    ServerScriptService/Boot/DataBoot.server.clpp
    ServerScriptService/Handlers/PlayerHandler.server.clpp
    ReplicatedStorage/Shared/Net/Net.flare
    StarterPlayer/StarterPlayerScripts/Controllers/DataController.client.clpp
    StarterPlayer/StarterCharacterScripts/Character/CharacterReady.client.clpp
  out/                    ← generated Luau (do not edit)
  libs/                   ← CluauppLibs
```

## Tiny program

```clpp
#include <clpp/roblox.clh>

void init() {
	Players players = GetService<Players>();
	post("online: " .: players.GetPlayers());
}
```

Language course and reference: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/). Migrating `.cpp`: [migration](/migration/).
