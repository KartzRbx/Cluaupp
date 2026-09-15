# Changelog

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
- Game template + IntelliSense header
- Libraries: full GitHub systems in CluauppLibs (Janitor, Promise, Fusion, Iris, Cmdr, TopbarPlus, Chrono, DataServiceV2, EzVisualz, StateMachine, Spring, Display, Module3D, FormatNumber) plus Cluaupp originals (Net, MathUtils, Twinkle, StickyBillboard, VfxUtil)
- Wally is optional; `node scripts/vendor-libs.js` re-copies from `vendor/` clones
- Moonwave docs (C++ types, const, safety, organization)
- Service architecture: filename tags (`.server` / `.client` / `.legacy.*` / module) plus AST intent scoring (combat, cache, players, …) — not leaderstats-only
- Type functions ArrayIndexer (`Table`) and Occlude (`Keys`) in CluauppLibs
