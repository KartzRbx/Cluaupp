# Changelog

## 0.1.2

- Watch does not write `out/` while any file fails to compile (Studio keeps the last good scripts).
- Watch/build skip rewriting Luau whose contents did not change (a space in C++ no longer floods Rojo).
- `libs/` is fill-only: missing files are restored, existing files are never overwritten or deleted. Fixes Rojo 7 crashing on `libs/ArrayIndexer` when watch/build raced a live serve.
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
