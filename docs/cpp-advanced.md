---
title: Advanced Cluaupp
sidebar_position: 14
---

# Advanced Cluaupp

CL++ is the language (`clpp` 0.2.6+). Cluaupp orchestrates Rojo and CluauppLibs. Full course: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

## Supported (CL++ 0.2.6)

- `.clpp` / `.clp` / `.clh`, tags `.server` / `.client`, `#pragma strict`, `void init()`
- `if` / `else` / `while` / C-style `for` / range-`for (T x in list)` / `switch` / `guard` / `match`
- `struct` + `Class::Method`, `new Class(parent)`, `GetService<T>()`, `static_cast<T>(x)`
- Property `.`, method `::`, table key `:`, concat `.:`
- Lambdas `func [](params) { }` — `func (params)` is a parse error on 0.2.6
- `post` / `warn` / `report`, `null`, `observable`, `signal`, `spawn` / `parallel`
- Quoted includes; angled `#include <clpp/...>` is IntelliSense-only
- Libraries via `#include <clpp/libs/janitor.clh>` → `require(ReplicatedStorage.CluauppLibs.Janitor)`

## Not in CL++

`->`, `continue`, ternary, `do/while`, `try/catch`, `goto`, `(void)x`, C++ captures `[&]`, `func (params)` without `[]`, ISO `std::`, JSX.

If you need a custom type, it is usually a **ModuleScript in shared** (a `.clp`) or a Wally package.

## `.` vs `::` vs `:`

| CL++ | Luau | When |
| --- | --- | --- |
| `player.Name` | `player.Name` | property |
| `player::FindFirstChild("x")` | `player:FindFirstChild("x")` | method |
| `CFrame:lookAt(a, b)` | `CFrame.lookAt(a, b)` | datatype table key |
| `DataService:Server` | `DataService.Server` | module table key |
| `janitor::Add(conn)` | `janitor:Add(conn)` | library method |
| `for (Player* p in list)` | `for _, p in list do` | range-for |

## Init

If a file defines `void init()`, `clpp` calls `init()` at the end of Scripts / LocalScripts. Shared modules (`.clp`) should **not** define `init()` unless you want them to run on require.

## Mixing extra Wally packages

CluauppLibs already contains Janitor, Fusion, Cmdr, DataServiceV2, … (copied into `runtime/`). Add Wally only for packages that are **not** in CluauppLibs. Headers live in `include/clpp/libs/`.

```clpp
#include <clpp/libs/dataservice.clh>

void Grant(Player* player, int amount) {
	Data* data = DataService:Server::WaitFor(player);
	guard (data != null) else {
		return;
	}
	int coins = data::Get(DataService:Server.Paths.Currencies.Coins);
	data::Set(DataService:Server.Paths.Currencies.Coins, coins + amount);
}
```

`Paths.Currencies.Coins` exists because **your** Template passed to `Init` had that field.

## Performance notes

- Prefer `const` and locals over recomputing in `RenderStepped`.
- `Net` already uses `buffer`. Batch when you can; do not fire per-heartbeat for every NPC.
- Janitor `Cleanup` is O(tracked objects). Link to the Instance that owns the scope.

## Conduct that still applies

1. **Initialize everything.** `int coins;` without a value is a bug; write `int coins = 0`.
2. **Small functions.** One behavior, named after the behavior.
3. **No magic numbers.** `const int MAX_INVENTORY = 20`.
4. **Early return.** Flatten `if` pyramids.
5. **Headers declare, scripts define.** Prototypes in `.clh`, bodies in `.clp` / `.clpp`.
6. **Do not share mutable statics across server and client** — use Net or DataService.

See also: [syntax](syntax.md), [libraries](libraries/index.md). Language: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).
