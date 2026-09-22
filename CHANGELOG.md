# Changelog

## Unreleased

- **Docs site sync** — Home / Why / Comparison / Benchmarks / Parallel / Typed DataModel / Product pillars / Getting started aligned to shipped platform. New [Studio tools](docs) page. Real measured benches via `scripts/bench-site.cjs` (registry ~700 ms cold; `examples/game` warm cache ~1.5 s vs cold ~3.7 s) with Mermaid charts. Docs chat prompt updated.
- **SoA / buffer codegen (opt-in)** — `cluaupp optimize --apply --layout` writes `#pragma layout soa` and emits `.cluaupp/generated/soa/*Soa.luau` (`--buffer` packs f32/i32 columns). Build also regenerates SoA for existing pragmas.
- **Studio debug panel** — CluauppNav dock: selection CL++ path, ScriptContext.Error → CL++ remap, Open IDE.
- **Studio↔IDE bridge** — `cluaupp bridge` (:3847); VS Code/Cursor polls and opens CL++ files on Studio events.
- **Authority call-graph** — `CLUAU_AUTH004` transitive Client/Shared → ServerScriptService/ServerStorage via include graph; `cluaupp check-authority`; wired into doctor.
- **PGO Studio ingest** — `cluaupp profile --ingest <jsonl>` merges playtest hits; `plugins/CluauppNav/ProfileLogger.luau` stub.
- **Luau stamps** — `-- cluaupp-source:` + `#pragma native` → `--!native` on emit; source maps no longer pruned.
- **Build** — `cluaupp build` uses async path so `-j/--jobs` applies; `--frozen` honored on async.
- **Incremental + parallel compile** — `.cluaupp/compile-cache` fingerprints sources; `build --no-incremental`, `-j/--jobs` (async path). Default incremental on.
- **Optimizer apply + PGO** — `cluaupp optimize --apply` inserts `#pragma native` on numeric-hot fns; `cluaupp profile` + `optimize --profile` ranks advice via `cluaupp.profile.json`.
- **Project docs** — `cluaupp docs` writes `.cluaupp/PROJECT.md` (DataModel, graph, Flare, advice).
- **Typed DataModel** — variable-root `WaitForChild` chains (`auto assets = …; assets.WaitForChild(...)`).
- **Flare** — parse `version N;` / `opt version = N` into schema; conflicts still via doctor/`--frozen`.
- **Platform analyzers (code)** — Parallel `CLUAU-PAR*`, Authority `CLUAU-AUTH*` + `cluaupp.config.json` rules, component contracts, Optimizer advisor (`cluaupp optimize`), security scan, lifetime heuristics, project graph, Flare version conflicts, file-level source maps on build, `build --frozen`, expanded `target doctor` / `analyze`. Wally thin `cluaupp add`.
- **Typed DataModel v1 (code)** — Parse Rojo `default.project.json` (+ `$path` filesystem scan) into an instance graph. Compile-time `WaitForChild`/`FindFirstChild` chain validation (`CLUAU_DM_MISSING_CHILD`). CLI: `cluaupp target datamodel`, `target check-datamodel`. Emits `.cluaupp/datamodel-profile.json` + `include/clpp/generated/datamodel.clh`. Wired into `cluaupp build` / compile payload (`datamodelProfilePath`).
- **Docs — Cluaupp Optimizer** — Philosophy locked: idiomatic CL++; compiler chooses table/SoA/buffer/native/parallel. Buffer ≠ programming model (wire Flare codecs stay separate). Page `architecture/optimizer`, roadmap + product-pillars + libraries index clarified. Modules demos: named `import { … } from`, Wallet/PlayerData, shared `const`.
- **Docs site** — Splash + Why / Benchmarks / Comparison / **Roadmap** (shipped vs next vs later). Absolute `/…` links rewritten relative for `base: /Cluaupp/`. CL++ version callouts updated to **0.7.0+**. Docs chat system prompt (`api/chat.js`) aligned to 0.7 + Context Safety / registry.
- **Product architecture (deep)** — Five true differentiators: Semantic / Authority / **Parallel** / DataModel / Performance compilers. Identity set: Typed DataModel + Thread Safety + Remote Contracts + Authority. Do not reinvent LSP/Rojo/debugger.
- **ThreadSafety in registry** — Normalize dump `ThreadSafety` onto properties/methods/events/callbacks; surface in `lsp-index.json`. Foundation for Parallel Compiler (`CLUAU-PAR*`).
- **Product architecture** — Canonical doc: Cluaupp = Roblox project host (five pillars, hard CL++/Cluaupp/ecosystem split, killer combo order). Context Safety v1 shipped; next = Typed DataModel.
- **Context Safety (v1)** — Compile-time capability rules from RunContext (`.server`/`.client`/`.plugin`): forbid `LocalPlayer` on server, `DataStoreService`/`ServerStorage`/`MessagingService` on client, wrong-direction `FireServer`/`FireClient`. Profile at `api/generated/capability-profile.json`; passed to `clpp` as `runContext` + `capabilityProfilePath`. CLI: `target capabilities`, `target check-context`.
- **Reuse-first Roblox backend** — Cluaupp integrates CL++ with the Roblox ecosystem (consume dump/docs → registry → bindings); does not reinvent LSP/IDE/sourcemap/docs. Exports `api/generated/lsp-index.json` for the CL++ Language Server. `api aux-diff` for optional `@rbxts/types` / LuauTypes coverage. Docs/CONTRIBUTING matrix CONSUME/GENERATE/IMPLEMENT/DO NOT BUILD.
- **Roblox Target Registry** — `src/api/` pipeline (loaders → normalize → validate → registry → generators), `RobloxTargetProfile` `schemaVersion` 2, `api/overrides/` (datatype migration from `DATATYPE_SPEC`), CLI `api` / `target`, lock + manifest, Luau `.d.luau` projection, Studio smoke harness, fixtures, coverage/diff.
- **CL++ contract** — `MIN_CLPP_VERSION` raised to **0.7.0**; compile payload may pass `targetProfilePath` / `targetCacheDir`.
- `npm run generate-api` delegates to `cluaupp api generate`.

## 1.5.1

- DataBoot `PlayerTemplate()` is rewritten to `TemplateData()` when that module is required (the constructor is the require bind).
- Cluaupp always reindents emitted Luau with the Roblox tab style (`stylua.toml`: tabs, width 4, double quotes). Nested `Connect` / Sweep `Add` lambdas no longer dump `end` at column 0. Blank lines separate `if` / `for` / `while` scopes at the same indent. Consecutive `Table.Field =` inits (struct tables) are compacted. `--format` still runs StyLua when it is on PATH.
- Method `~>` Connect hoists Sweep to `self.janitor` (one per controller). Instance binds (`Touched`, etc.) keep a local Sweep and `LinkToInstance` so they die with that instance.
- Ward rate-limit (`Allow`) drops extra packets instead of striking every deny. A strike happens only after `FloodAt` (80) consecutive denials. Clicker spam is not a kick. Studio still does not Kick unless `KickInStudio`.
- Ward no longer kicks Studio playtests by default (`KickInStudio = false`). Spawn/respawn get 3s grace, `lastPos` resets when the character is missing, Heartbeat uses a 1/30 dt floor, and mostly-vertical falls are not speed strikes. Placeholder spawn/fall no longer stacks to “Movement or traffic rejected”.
- Gleam stores per-instance Sweep in a weak table. Assigning `_gleamSweep` on a `ScreenGui` errors (`not a valid member`).
- Postprocess qualifies bare `HiveWorld` as `Hive.HiveWorld` (or `any` if Hive is not required) and reapplies Roster / ReplicatedStorage rewrites when writing `out/`.
- Postprocess rewrites `Instance.new("Roster")` to `Roster.new()`, and replaces `script.Parent…ReplicatedStorage` walks with `ReplicatedStorage`. `Roster.New` is an alias of `Roster.new`.
- Postprocess also rewrites `Sweep.New` / `Spark.New` / `Coil.New` → `.new`, and `Pin.new_` / `Crest.new_` / `Stage.new_` → `.new`. Runtime aliases: `Sweep.New`, `Coil.New`, `Pin.new_`, `Crest.new_`.
- **Editor** — `npm install` / `cluaupp init` / `cluaupp intellisense` install the Cursor/VS Code extension for `.flare` `.hive` `.mint` `.bloom` `.helm` `.shift` `.axiom` (postinstall + init).
- **Hive** `Set` / `Get` / `Remove` / `Has` / `Query` / `Snapshot` accept either a numeric component id or a generated schema row `{ Id = n, Fields = … }` (`.hive` Luau emit). Snapshot no longer crashes with `writeu8` on a table.
- **Pin** no longer assigns `BillboardGui.MinDistance` (not a Roblox property). `PinOptions.MinDistance` stays in the API as reserved/ignored.
- **Schema highlighting** — `.hive` `.mint` `.bloom` `.helm` `.shift` `.axiom` (plus existing `.flare`) in the Cluaupp editor extension. `cluaupp intellisense` / `cluaupp init` associate the extensions.
- **CL++ skills book** — `skills/clpp-language`, `clpp-style`, `clpp-hive-flare`. `cluaupp init` copies them to `.cursor/skills/`.
- **Flare** packs `...` instances **before** the query `pcall`. Nested `function()` cannot see `...` (`Cannot use '...' outside of a vararg function`).

## 1.5.0

- **Flare IntelliSense** — VS Code / Cursor extension for `.flare` (highlighting, completions, hover, diagnostics, outline, snippets). `cluaupp intellisense` installs it; `cluaupp lsp` serves the same engine.
- **Roster** constructor is `new Roster()` / `new Roster(table)` (emits Luau `Roster.new`). `Find` is array search; dictionary keys use `Has` / `Set` / `Remove`.
- Init DataBoot builds `PlayerTemplate playerData = PlayerTemplate()` so Keep.Server.Init receives a table. Prefer CL++ **0.3.4** for nested template types and `Roster.new`.

## 1.4.1

- **`cluaupp init --help`** names the 1.4.0 service tree (`ReplicatedStorage`, `ServerScriptService`, `StarterPlayer`), not `src/server` / `src/client` / `src/shared`.
- Handbook: Flare **Ready / Welcome / Session** handshake, Connection example, and leftover CLI/path pages aligned with the service layout.

## 1.4.0

- **Init** writes a Roblox service tree (`ServerScriptService`, `ReplicatedStorage/Shared`, `StarterPlayer`, `ServerStorage`, `ReplicatedFirst`) with DataBoot + TemplateData. Breaking: no more `src/server` / `src/client` / `src/shared`.
- Native CluauppLibs only: **Flare, Sweep, Spark, Keep, Mint, Axiom, Roster, Gleam, Bloom, Lens, Crest, Pin, Stage, Coil, Helm, Shift, Hive, Ember, Echo, Guide, Trace, Ward**. No Wally alias folders, no `@cluaupp/janitor` workspaces. Promise stays evaera. Libs ship inside the `cluaupp` npm tarball (`runtime/`).
- Buffer law: `.flare` / `.mint` / `.bloom` / `.helm` / `.shift` / `.hive` / `.axiom` pack u8 ids, ColorSequence, or tables — no JSON on the hot path. Net codec tables use tagged buffers (no `JSONEncode`).
- **Keep** is ProfileStore-class session lock plus duplication-proof trade escrow: `Reserve` deducts into a vault, `Commit` credits with receipts and `SaveWait`s both profiles (in-place rollback if a save fails), `AbortIfActive` on leave.
- **Ward** is the server anti-cheat kernel (rate-limit remotes, packet cap, speed strikes). Flare, Net, Keep replication, and Helm call Ward on inbound client buffers. Hive worlds are authoritative (client writes no-op) by default.
- **Sweep** is the zelador (`~>` Connect). **Spark** is engine-grade GoodSignal (O(1) Disconnect, reentrant Fire queue, `ConnectParallel`). **Shift** compiles FSM/HSM to u8. **Hive** is jecs-style ECS.
- Starlight handbooks per native name. HUD: Gleam+Mint+Bloom. NPC: Shift+Hive.
- Instance headers flatten inherited members and creatable classes get `Class()` plus `Class(Instance parent)`.
- Accept CL++ **0.3.3** (same JSON contract as 0.3.2).
- `#include <clpp/libs/keep.clh>` (and the other native headers) now insert `require(ReplicatedStorage.CluauppLibs.*)` even when CL++ does not list the lib in `artifact.libraries`. Template `include/clpp/libs/` ships every native `.clh`.

## 1.3.0

Align with CL++ **0.3.2**.

- Require `clpp` 0.3.2 (`CLPP` / `CLPP_PATH`, then PATH, then `%LOCALAPPDATA%\Programs\CLPP`).
- Instances are class names: `Player player`, never `Player*`. Default listen is `~>Connect`; fire with `.Fire`.
- `@this` / `@field` only inside `Class::Method`. `void init()` holds a local Janitor.
- Compile failures surface `diagnostics[]` (1-based). `watch` compiles with async `spawn`.
- Templates, examples, headers, and handbook match the 0.3.2 operator table.
- Docs site is Starlight (Astro) in `docs/`, with the official CL++ TextMate grammar for `clpp` fences.

## 1.2.1

Align with CL++ **0.3.0** accessors.

- `.` is properties, table keys, **and** instance methods (`player.Name`, `DataService.Server`, `player.FindFirstChild("x")`).
- `:` is **not** a table/property accessor. It is types (`age: int`) and protected calls (`player:Kick()` → `pcall`).
- `::` stays for statics and manual Connect (`task::wait`, `Color3::fromRGB`, `players.PlayerAdded::Connect`).
- Pick the newest `clpp` on PATH. Refuse compilers older than **0.3.0**.
- Language diagnostics stay with `clpp install` (no keystroke recompile from Cluaupp).
- Range-for is `for (T x in list)`.

## 1.2.0

Properties use `.`. Manual Connect uses `::`: `players.PlayerAdded::Connect(fn)`. Instance methods also use `.` (`player.FindFirstChild`). Do not use `:` for tables.

## 1.1.0

CL++ 0.3.0: anonymous callbacks are `func (params) { }`. `func [](…)` and C++ capture lists are rejected by `clpp`.

- Examples, README, migration table, and docs use `func (…)` / `func ()`.
- Requires CL++ **0.3.0** on PATH (`clpp install` for the error lens).

## 1.0.0

Breaking: Cluaupp no longer transpiles a C++ subset. Games are **CL++** (`.clpp` / `.clp` / `.clh`). The CLI orchestrates the [`clpp`](https://github.com/KartzRbx/CLPP) binary (`clpp api compile`), post-processes Luau (`ClppLibs` → `ReplicatedStorage.CluauppLibs`), and writes `out/` for Rojo.

- Requires `clpp` on PATH (`CLPP_PATH` override). Language, IntelliSense, and codegen live in CL++ (`clpp install`).
- `cluaupp language` prints `clpp api manifest`.
- Templates and `examples/game` use CL++ syntax (`guard`, `match`, `signal`, `.:`, `::`, Fusion).
- Docs site and README are CL++ × Luau (no clangd / `.cpp` toolchain).
- Tree-sitter C++ frontend removed. ForeverHD `"architecture": true` folder split is not implemented on this path.
- See [migration](docs/migration.md) and [CL++ docs](https://kartzrbx.github.io/CLPP/).

## 0.2.3

- Parser accepts `(void)x`, `static_cast<T>(x)`, `static constexpr` fields, and lambdas (`[](Player* p) { ... }`, `[&]`, `[=]`) so `Connect` / `BindToClose` compile without named-function wrappers.
- Parser keeps `LuaArray<T>` / `vector<T>` field types on structs (`HotBar` / `Storage` on a Template).
- `string_concat(...)` joins to Luau `..` (alongside string `+`).
- Cursor is not a licensed host for Microsoft `ms-vscode.cpptools`. Cluaupp no longer writes `C_Cpp.*` settings or `c_cpp_properties.json`; `watch` strips leftover keys and marks cpptools as unwanted. C++ completion stays clangd.
- Docs site is a C++-class handbook (syntax through lambdas and Luau `--!strict`). Per-class and per-enum dump pages are gone; engine members stay on create.roblox.com.
