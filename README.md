# Cluaupp

<p align="center">
  <img src="site/assets/logo.png" alt="Cluaupp" width="160">
</p>

**CL++ games on Roblox.** You write [CL++](https://kartzrbx.github.io/CLPP/). Cluaupp runs `clpp`, wires Rojo, and copies CluauppLibs.

[CL++ language](https://kartzrbx.github.io/CLPP/) · [Docs](https://kartzrbx.github.io/Cluaupp/) · [Handbook](https://kartzrbx.github.io/Cluaupp/docs/)

[![npm version](https://img.shields.io/npm/v/cluaupp.svg)](https://www.npmjs.com/package/cluaupp)
[![Node.js](https://img.shields.io/node/v/cluaupp.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-white.svg)](LICENSE)

Cluaupp is the **toolchain**, not the language compiler. [KartzRbx/CLPP](https://github.com/KartzRbx/CLPP) owns syntax, IntelliSense (`clpp install`), and Luau codegen. This CLI finds `.clpp` / `.clp` / `.clh`, runs `clpp api compile`, rewrites `ClppLibs` → `ReplicatedStorage.CluauppLibs`, and writes `out/` for Rojo.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

void init() {
	Players* players = GetService<Players>();
	players::PlayerAdded~>Connect(func [](Player* player) {
		guard (player != null) else {
			return;
		}
		post("hello, " .: player.Name);
	});
}
```

## Install

1. [Node.js](https://nodejs.org/) 18+
2. [Rojo](https://rojo.space/) **7.7.0**
3. **`clpp` on PATH** from [CL++](https://github.com/KartzRbx/CLPP) (`cargo install --path .`)

```bash
npm install -g cluaupp
clpp install
npx cluaupp init my-game
cd my-game
rokit install
cluaupp build
rojo serve
```

| Source | Output | Rojo |
| --- | --- | --- |
| `*.server.clpp` | `*.server.luau` | Script |
| `*.client.clpp` | `*.client.luau` | LocalScript |
| `*.clp` / untagged `.clpp` | `*.luau` | ModuleScript |
| `*.clh` | `*.luau` | ModuleScript |

## CLI

```bash
cluaupp init [folder]
cluaupp build [folder]
cluaupp watch [folder]
cluaupp language          # clpp api manifest
cluaupp intellisense      # files.associations + clpp install
```

`clpp` missing? Set `CLPP_PATH` or install [CL++](https://github.com/KartzRbx/CLPP).

## Language

Course and reference: **[kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/)**.

Exclusive CL++ (`guard`, `match`, `signal`, `observable`, `.:`, `::`, `~>`, Fusion) is compiled by `clpp`. Samples: [`examples/game`](examples/game). Old C++ games: [docs/migration.md](docs/migration.md).

## License

MIT
