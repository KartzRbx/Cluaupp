# Cluaupp

<p align="center">
  <img src="site/assets/logo.png" alt="Cluaupp" width="160">
</p>

**The definitive merge of C++ and modern Luau.**

[Docs](https://kartzrbx.github.io/Cluaupp/) · [Handbook](https://kartzrbx.github.io/Cluaupp/docs/)

[![npm version](https://img.shields.io/npm/v/cluaupp.svg)](https://www.npmjs.com/package/cluaupp)
[![Node.js](https://img.shields.io/node/v/cluaupp.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Source-to-source transpiler: you write a C++ subset, Cluaupp emits modern [Luau](https://luau.org/getting-started) (`local`, `const`, optional `--!strict`). C++ structure, Luau quality, one language.

No WASM. No Emscripten. No `lua_call`. Roblox APIs come out as they do in Studio: `game:GetService("Players")`, `player:FindFirstChild("leaderstats")`, `players:GetPlayers()`.

```cpp
auto* players = GetService<Players>();
for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}
players->PlayerAdded.Connect(CreateLeaderstats);

auto* part = new Part(workspace);
part->Size = Vector3(8, 1, 8);
part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
frame->Size = UDim2::fromScale(1, 1);
```

becomes

```luau
--!strict
local players: Players = game:GetService("Players")
for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end
players.PlayerAdded:Connect(CreateLeaderstats)
```

## Install

Node.js 18+ and [Rojo](https://rojo.space/) **7.7.0** for Studio sync (`rokit.toml` in the game template).

```bash
npm install -g cluaupp
```

Or run without a global install:

```bash
npx cluaupp init my-game
```

## Quick start

```bash
cluaupp init my-game
cd my-game
rokit install
cluaupp build
rojo serve
```

Connect the Rojo plugin in Roblox Studio. Edit `src/**/*.{cpp,h,hpp}`, run `cluaupp watch` to rebuild on save.

C++ autocomplete is **clangd**, not a Cluaupp tokenizer and not Microsoft cpptools. Put `#include <cluaupp/roblox.hpp>` at the top of each script; `cluaupp init` writes `.clangd` / `compile_flags.txt` / `compile_commands.json` with `-Iinclude` so clangd finds that header. Tree-sitter is only used to compile. See [IntelliSense](docs/intellisense.md).

```
src/server/*.server.cpp  →  out/server/*.server.luau  Script
src/client/*.client.cpp  →  out/client/*.client.luau  LocalScript
src/shared/*.cpp         →  out/shared/*.luau         ModuleScript
```

Filename tags: `.server.cpp`, `.client.cpp`, `.legacy.server.cpp`, `.legacy.client.cpp`, or no tag (ModuleScript). One source file becomes one instance. Set `"architecture": true` only for the old PascalCase folder split. See [Architecture](docs/architecture.md) and [OOP structure](docs/oop/index.md).

Compiler TypeScript lives in `src/`. Sample game C++ is [`examples/game`](examples/game) (`src/server`, `src/client`, `src/shared`). `cluaupp init` still copies [`templates/game`](templates/game).

## Documentation

| Guide | What it covers |
| --- | --- |
| [Getting started](docs/getting-started.md) | Install, first project, Rojo, IntelliSense |
| [**Docs + API (GitHub Pages)**](https://kartzrbx.github.io/Cluaupp/) | Site, Learn tab, every class / datatype / enum |
| [Learn](https://kartzrbx.github.io/Cluaupp/learn/) | C++ subset, Luau output, safety, architecture |
| [CLI](docs/cli.md) | `init`, `build`, `watch`, flags |
| [Syntax](docs/syntax.md) | C++ subset → Luau (`local`, `const`, types) |
| [print and cout](docs/print-cout.md) | `cout <<`, `cout::warn`, `endl` |
| [Roblox API](docs/roblox-api.md) | Vector3, CFrame, UDim2, GetService, Instance.new |
| [Architecture](docs/architecture.md) | One file in, one file out; opt-in ForeverHD folders |
| [OOP structure](docs/oop/index.md) | File tags, services, modules, structs |
| [Libraries](docs/libraries/index.md) | DataService Init, Janitor, Promise, Net |
| [Examples](docs/examples/index.md) | Leaderstats, combat validation, shop, HUD, sword |
| [C++ types](docs/cpp-types.md) | Typing, `const`, safety, organization |
| [Comparison](docs/comparison.md) | vs roblox-ts and WASM toolchains |
| [Contributing](CONTRIBUTING.md) | Tests, layout, how to ship |

## Programmatic API

```js
const { compileSource, compileService } = require("cluaupp");

const luau = compileSource(
	`void init() { print("ok"); }`,
	"init.cpp",
	{ strict: true },
);

const service = compileService(
	cppSource,
	"server/leaderstats.server.cpp",
	{ relativeName: "server/leaderstats.server.cpp" },
);
// service.files → LeaderStats/Main.luau, PlayersManager, CacheController, Types
```

## License

MIT
