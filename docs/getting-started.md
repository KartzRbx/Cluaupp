# Getting started

Cluaupp installs from **npm**, the same channel as roblox-ts and most Roblox tooling outside Studio.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Rojo](https://rojo.space/) **7.7.0** to sync `out/` into Studio (`cluaupp init` writes `rokit.toml`; run `rokit install`)
- LLVM clangd for C++ IntelliSense (Cursor / VS Code — installed by `cluaupp init`)

## Install the compiler

Global (`cluaupp` on your PATH):

```bash
npm install -g cluaupp
cluaupp --version
```

Without a global install, via `npx`:

```bash
npx cluaupp init my-game
```

As a game dependency:

```bash
npm install --save-dev cluaupp
```

```json
{
	"scripts": {
		"build": "cluaupp build",
		"watch": "cluaupp watch"
	}
}
```

## First game

```bash
cluaupp init my-game
cd my-game
rokit install
cluaupp build
rojo serve
```

In Roblox Studio: install the Rojo plugin and connect to `localhost:34872` (default port).

Generated layout:

```
my-game/
  cluaupp.config.json
  default.project.json    ← Rojo
  include/cluaupp/roblox.hpp
  include/cluaupp/libs/
  libs/                   ← CluauppLibs (Janitor, Fusion, Cmdr, DataService, …)
  Packages/               ← optional extra Wally
  wally.toml
  src/
    server/leaderstats.server.cpp
    client/init.client.cpp
    shared/config.h
    shared/config.cpp
  out/                    ← generated Luau (do not edit)
    server/leaderstats.server.luau
    client/init.client.luau
    shared/Config.luau
```

## Datatypes (Vector3, CFrame, UDim2)

```cpp
#include <cluaupp/roblox.hpp>

void init() {
	auto* part = new Part(workspace);
	part->Size = Vector3(8, 1, 8);
	part->Position = Vector3(0, 10, 0);
	part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
	part->Color = Color3::fromRGB(255, 0, 0);
	part->Material = Enum::Material::Plastic;

	auto* frame = new Frame();
	frame->Size = UDim2::fromScale(1, 1);
	frame->Position = UDim2(0, 0, 0.5, 0);
}
```

This becomes `Vector3.new`, `CFrame.lookAt`, `Color3.fromRGB`, `UDim2.fromScale`, `Enum.Material.Plastic`.

How to spell engine calls: [Roblox in Cluaupp](https://kartzrbx.github.io/Cluaupp/docs/engine.html). Official members: [create.roblox.com](https://create.roblox.com/docs/reference/engine). The complete subset: [Language reference](https://kartzrbx.github.io/Cluaupp/docs/reference.html).

## How to write

Every `.cpp` / `.h` / `.hpp` file can start with the IntelliSense header. Angle-bracket includes are ignored. Quoted `#include "config.h"` is inlined into the file.

```cpp
#include <cluaupp/roblox.hpp>

void CreateLeaderstats(Player* player) {
	if (player->FindFirstChild("leaderstats") != nullptr) {
		return;
	}

	auto* leaderstats = new Folder(player);
	leaderstats->Name = "leaderstats";
}

void init() {
	auto* players = GetService<Players>();
	for (auto* player : players->GetPlayers()) {
		CreateLeaderstats(player);
	}
	players->PlayerAdded.Connect(CreateLeaderstats);
}
```

If a file defines `void init()`, Cluaupp calls `init()` at the end of the `.luau`. Use that in Scripts and LocalScripts.

## IntelliSense

`cluaupp init` writes clangd config and installs LLVM `clang++` plus the clangd editor extension when missing. Then reload the window. Completion is clangd; Cluaupp does not index C++ itself.

```bash
cluaupp intellisense
```

`#include <cluaupp/roblox.hpp>` at the top of each source file. The header is **not** compiled to Luau. clangd learns that path from `-Iinclude` in `.clangd`, `compile_flags.txt`, and `compile_commands.json`.

See [IntelliSense](intellisense.md).

## Watch

```bash
cluaupp watch
```

Saving a `.cpp`, `.h`, or `.hpp` under `src/` rebuilds the project. Keep Rojo running at the same time.

## Libraries

`cluaupp build` copies runtime modules to `libs/` (Rojo: `ReplicatedStorage.CluauppLibs`). Include a header and the compiler injects `require`.

```cpp
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>

void init() {
	auto* janitor = new Janitor();
	auto* coins = Net::Event("Coins");
	janitor->Add(coins);
}
```

Wally is optional. Fusion, Cmdr, DataServiceV2, and the rest ship **inside** `libs/` (full GitHub source). See [Libraries](libraries/index.md) — start with [DataService Init](libraries/dataservice.md) and [Janitor](libraries/janitor.md).

See [Libraries](libraries/index.md), [OOP](oop/index.md), [types](cpp-types.md), [safety](cpp-safety.md).

## Next

Language handbook (GitHub Pages): **[Docs](https://kartzrbx.github.io/Cluaupp/docs/)** — [every construct](https://kartzrbx.github.io/Cluaupp/docs/reference.html).

- [C++ → Luau syntax](syntax.md)
- [print and cout](print-cout.md)
- [C++ types](cpp-types.md)
- [const](cpp-const.md)
- [Safety](cpp-safety.md)
- [Organization](cpp-organization.md)
- [Architecture](architecture.md)
- [OOP structure](oop/index.md)
- [Libraries](libraries/index.md)
- [Examples](examples/index.md)
- [Roblox API](roblox-api.md)
- [CLI](cli.md)
