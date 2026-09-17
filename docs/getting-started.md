# Getting started

Cluaupp is the **game toolchain**. [CL++](https://kartzrbx.github.io/CLPP/) is the **language**.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Rojo](https://rojo.space/) **7.7.0** (`cluaupp init` writes `rokit.toml`)
- **`clpp` on PATH** from [KartzRbx/CLPP](https://github.com/KartzRbx/CLPP)

```bash
cargo install --path .   # inside a CL++ checkout
clpp install             # VS Code / Cursor language pack
```

## Install Cluaupp

```bash
npm install -g cluaupp
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
    server/leaderstats.server.clpp
    client/init.client.clpp
    shared/config.clp
  out/                    ← generated Luau (do not edit)
  libs/                   ← CluauppLibs
```

## Tiny program

```clpp
#include <clpp/roblox.clh>

void init() {
	Players* players = GetService<Players>();
	post("online: " .: players::GetPlayers());
}
```

Language course and reference: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/). Migrating `.cpp`: [migration](migration.md).
