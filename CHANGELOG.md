# Changelog

## 1.2.1

Align with CL++ **0.2.6** (the current KartzRbx/CLPP release — there is no 0.3.0).

- Pick the newest `clpp` on PATH (installer 0.2.6 over stale cargo 0.1.0). Refuse compilers older than **0.2.6**.
- Stop live `clpp api compile` from the Cluaupp editor helper / LSP (that duplicated `source=clpp` and froze IntelliSense).
- Range-for is `for (T x in list)`, not C++ `:`.
- Lambdas are `func [](params)`. `func (params)` and `(void)x` are parse errors on 0.2.6.
- Table keys use `:` (`Color3:fromRGB`, `UDim2:fromScale`, `Fusion:scoped`, `DataService:Server`).

## 1.2.0

Properties use `.`, methods use `::`: `players.PlayerAdded::Connect(fn)`.

- Templates, examples, README, and handbook match that accessor rule.
- `~>` is not used in Cluaupp samples (`signal::Connect` / `signal::Once`).

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
