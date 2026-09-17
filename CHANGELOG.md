# Changelog

## Unreleased

## 0.2.0

- CLI rewritten as a TypeScript collector-emitter pipeline: Tree-sitter collection, Rojo-mapped `require`s, ordered Luau blocks (Services → Requires → Types → Constants → Code), then optional StyLua / `luau-analyze`. Commands `init`, `build`, `watch`, `lsp`, and `intellisense` stay. `cluaupp build -i file.cpp -o out.luau --rojo default.project.json` is the single-file path.
- C++ IntelliSense is **clangd** only. The old tokenizer/`completeAt` engine is gone. Tree-sitter is the compiler frontend. `cluaupp lsp` publishes subset parse errors only.
- `SystemUnderstander` scans identifiers, scores Roblox intents, and stamps Controller / Manager / utility plus `GetService` injections. Filename tags still decide Script vs LocalScript vs ModuleScript.
- Sample game C++ lives in `examples/game/` (`src/server`, `src/client`, `src/shared`). Compiler `src/` is TypeScript only.
- CLI security: StyLua / luau-analyze via `spawn` without a shell; emitted paths cannot leave the project; `.env*` stays out of git and the npm pack.
- Docs / GitHub Pages: clangd, SystemUnderstander, one-file-out emit, `examples/game`. Rojo **7.7.0**.
- Tests cover `out/` tree, types, modules, path safety, and understander roles.

## 0.1.5

- Default emit is one tagged `.cpp` → one `.server.luau` / `.client.luau`. `"architecture": true` keeps the old ForeverHD service folders.
- `--!strict` is opt-in: `#pragma strict`, `#pragma nstrict`, or `"strict": true` in config (default `false`).
- `.h` / `.hpp` emit type ModuleScripts (`export type` + typed table). A sibling `.cpp` becomes `*Impl.luau`; the header binds those functions.
- Shared `#include` modules `require` game-rooted paths (`ReplicatedStorage.Cluaupp...` / `ServerScriptService.Cluaupp...`).

## 0.1.4

- Quoted `#include "Header.h"` of project files becomes `const Header = require(...)`. Header-only structs emit a constructor (`TemplateData()`); const headers bind `PLAYER_DATA_VERSION` from the module. Boot scripts require services (`LeaderstatsServer:init()`).
- Keep `const` for injected `require` / `GetService` and `const function` for C++ functions (not `local`).
- `init.meta.json` stays pure JSON. Library `require` injection no longer prepends Luau onto Rojo meta files (which made `rojo serve` fail with a JSONC parse error).
- Server services emit `init.server.luau` + `init.meta.json` with **only** `RunContext.Server`. Rojo forbids `className` when an `init.*` script exists (the folder is already a Script, not a Folder). `init.luau` is pruned so the instance is not a ModuleScript.

## 0.1.3

- Architecture: generated services keep a fixed declaration order (requires, types, constants, variables, functions, cleanup, return) without section banners. Domain `Stop` runs `janitor:Cleanup()`.
- IntelliSense: `cluaupp init` / `cluaupp intellisense` install Microsoft `ms-vscode.cpptools` (VSIX on Cursor, where the marketplace omits it), write `.vscode/c_cpp_properties.json` (LLVM clang++, C++20, `include/` + `src/`, `compile_commands.json`), and disable clangd so the two engines do not fight. `build`/`watch` only refresh `compile_commands.json`.
- `Class::method` on game types becomes `Class:method()` (`self`). Datatype/library statics stay dotted (`CFrame.lookAt`, `Color3.fromRGB`, `FormatNumber.Abbreviate`).
- `switch` / `case` / `default` / `break` compile to a one-shot `repeat` with `if` / `elseif` / `else`. The discriminant is evaluated once; stacked `case` labels share a body; `break` leaves the switch even from inside an `if`.
- Janitor typed border re-exports `_impl` (`export type Janitor = Impl.Janitor; return Impl`). It no longer invents `Has` or requires Promise for a parallel type that did not match howmanysmall.
- Emit: injected `require` / `GetService` are `const`. C++ functions emit as `const function` instead of `local function`.
- `.server.cpp` emits `init.luau` + `init.meta.json` with `RunContext.Server`. `init.server.luau` is Legacy and is pruned.
- `cout << ... << endl` emits `print(...)`. `cerr <<` emits `warn`. `cout::print` / `cout::warn` / `cout::error` / `cout::ping` map to the Roblox globals.
- Docs: [print and cout](docs/print-cout.md); [Libraries](docs/libraries/index.md) how-tos (DataService Init, Janitor, Promise, Net); [OOP structure](docs/oop/index.md) (file tags, services, modules); [Examples](docs/examples/index.md) (leaderstats, combat validation, shop, HUD, sword). GitHub Pages Learn tabs: OOP, Libraries, print/cout, Examples — generated into `site/` (`guide/oop.html`, `guide/examples.html`).

## 0.1.2

- Watch does not write `out/` while any file fails to compile (Studio keeps the last good scripts).
- Watch/build skip rewriting Luau whose contents did not change (a space in C++ no longer floods Rojo).
- Watch never copies `libs/` or headers. Changing a constant no longer makes Rojo 7 crash on `libs/ArrayIndexer`.
- `libs/` on `cluaupp build` is fill-only: missing files are restored, existing files are never overwritten or deleted.
- Filename tags: `.server.cpp` → Script (`init.server.luau`), `.client.cpp` → LocalScript (`init.client.luau`), `.plugin.cpp` → Plugin, `.legacy` / `.legacy.client` / `.legacy.server` → Legacy. Bare `init.luau` is not used for `.server` (Rojo would make a ModuleScript).
- Dropped `$optional` from `default.project.json` (Rojo 7.7 failed to deserialize it).

## 0.1.1

- DataService: `DataServiceOptions<T>.Template` is the required player-data table (`T` matches the save struct). Also documents `Exclude`.
- Compiler: C++ designated initializers (`Type { .Field = value }`) emit Luau tables, so `DataService.Server:Init({ Template = ... })` type-checks and compiles.
- Watch/build: delete orphaned `out/` files when a source is removed. Never wipe `out/` or `libs/` as a whole — Rojo 7 crashes if `libs/ArrayIndexer` disappears mid-serve. Vendor files are only created if missing; existing `libs/` is never overwritten on watch/build. Watch skips writing `out/` when compile fails, and skips rewriting Luau whose contents did not change.

## 0.1.0

- Product name: **Cluaupp** (C++ × Luau)
- First public release
- CLI: `init`, `build`, `watch`, `--version`
- Transpile C++ subset → Luau `--!strict`
- `local` and `const x = ...`
- Full Roblox API from the official dump (925 classes, 636 enums)
- Datatypes: Vector3, Vector2, CFrame, UDim, UDim2, Color3, BrickColor, Rect, Ray, …
- `Enum::Material::Plastic` → `Enum.Material.Plastic`
- GitHub Pages site for every class, method, and event
- Game template + IntelliSense header (`roblox.hpp`, `compile_flags.txt`, clangd)
- IntelliSense headers are valid C++: `LuaArray` for `GetPlayers`, templated `Connect`, optional dump defaults (`FindFirstChild`), no recursive `Vector3.Unit` field
- Libraries: full GitHub systems in CluauppLibs (Janitor, Promise, Fusion, Iris, Cmdr, TopbarPlus, Chrono, DataServiceV2, EzVisualz, StateMachine, Spring, Display, Module3D, FormatNumber) plus Cluaupp originals (Net, MathUtils, Twinkle, StickyBillboard, VfxUtil)
- Wally is optional; `node scripts/vendor-libs.js` re-copies from `vendor/` clones
- Moonwave docs (C++ types, const, safety, organization)
- Service architecture: filename tags (`.server` / `.client` / `.legacy.*` / module) plus AST intent scoring (combat, cache, players, …) — not leaderstats-only
- Type functions ArrayIndexer (`Table`) and Occlude (`Keys`) in CluauppLibs
