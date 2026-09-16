# Changelog

## 0.1.3

- Architecture: the domain controller keeps every user function. CacheController is generated separately and must not delete `SetupPlayerManager` while `init` still calls it. `GetChangedSignal` on `Paths.Currencies` is kept.
- Janitor typed border re-exports `_impl` (`export type Janitor = Impl.Janitor; return Impl`). It no longer invents `Has` or requires Promise for a parallel type that did not match howmanysmall.
- Emit: injected `require` / `GetService` are `const`. C++ functions emit as `const function` instead of `local function`.
- `.server.cpp` emits `init.luau` + `init.meta.json` with `RunContext.Server`. `init.server.luau` is Legacy and is pruned.
- `cout << ... << endl` emits `print(...)`. `cerr <<` emits `warn`. `cout::print` / `cout::warn` / `cout::error` / `cout::ping` map to the Roblox globals.
- Docs: [print and cout](docs/print-cout.md); [Libraries](docs/libraries/index.md) how-tos (DataService Init, Janitor, Promise, Net); [OOP structure](docs/oop/index.md) (file tags, services, modules); [Examples](docs/examples/index.md) (leaderstats, combat validation, shop, HUD, sword).

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
