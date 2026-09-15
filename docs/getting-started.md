# Getting started

Cluaupp installs from **npm**, the same channel as roblox-ts and most Roblox tooling outside Studio.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [Rojo](https://rojo.space/) to sync `out/` into Studio
- An editor with C++ IntelliSense (Cursor / VS Code + the C/C++ extension)

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
    server/LeaderStats/     Main, PlayersManager, CacheController, Types
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

Full reference (every class from [create.roblox.com](https://create.roblox.com/docs/reference/engine)): [Cluaupp GitHub Pages](https://kartzdev.github.io/cluaupp/).

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

`cluaupp init` copies `include/cluaupp/roblox.hpp` and a `.vscode/c_cpp_properties.json`. The include path points at `include/`.

Complete `Player`, `FindFirstChild`, `GetPlayers` in the editor. The header is **not** compiled to Luau; it only feeds the C++ language server.

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

Wally is optional. Fusion, Cmdr, DataServiceV2, and the rest ship **inside** `libs/` (full GitHub source). See [Libraries](libraries.md).

See [Libraries](libraries.md), [types](cpp-types.md), [safety](cpp-safety.md).

## Next

- [C++ → Luau syntax](syntax.md)
- [C++ types](cpp-types.md)
- [const](cpp-const.md)
- [Safety](cpp-safety.md)
- [Organization](cpp-organization.md)
- [Architecture](architecture.md)
- [Roblox API](roblox-api.md)
- [CLI](cli.md)
