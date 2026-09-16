---
title: Advanced Cluaupp
sidebar_position: 14
---

# Advanced Cluaupp

The subset is intentional. What exists is enough for game scripts; what is missing is listed so you do not fight the compiler.

## Supported

- Functions, prototypes (headers only), `if` / `else` / `while` / range-`for`
- `new Class(parent)`, `GetService<T>()`, `::` statics (`CFrame::lookAt`, `Enum::Material::Plastic`)
- `->` methods and properties, `.` members, `Connect`
- `const`, `auto`, `nullptr`, arithmetic, `&&` `||` `!=`
- Quoted includes, `.h` / `.hpp` as sources
- Libraries via `#include <cluaupp/libs/...>` → `require(CluauppLibs.*)`

## Not supported (yet)

Full C++: templates besides `GetService<T>`, `class` bodies as emitted types, `std::`, overloading as two runtimes, `switch`, C-style `for`, macros, pointer arithmetic.

If you need a custom type, it is usually a **ModuleScript in shared** (a `.cpp` of functions) or a Wally package, not a C++ class the compiler would lower to a metatable.

## `::` vs `:` vs `.`

| C++ | Luau | When |
| --- | --- | --- |
| `CFrame::lookAt(a, b)` | `CFrame.lookAt(a, b)` | datatype / enum / module static |
| `MathUtils::Lerp(a, b, t)` | `MathUtils.Lerp(a, b, t)` | Cluaupp module function |
| `Module3D::Attach3D(frame, model)` | `Module3D:Attach3D(frame, model)` | Module3D’s colon API |
| `player->FindFirstChild("x")` | `player:FindFirstChild("x")` | Instance method |
| `player->Name` | `player.Name` | property |
| `janitor->Add(conn)` | `janitor:Add(conn)` | library method |

## Init

If a file defines `void init()`, Cluaupp calls `init()` at the end of the `.luau`. Use that as the Script / LocalScript entry. Shared modules should **not** define `init()` unless you want them to run on require.

## Mixing extra Wally packages

CluauppLibs already contains the full Janitor, Fusion, Cmdr, DataServiceV2, … systems (copied from GitHub into `runtime/`). Add Wally only for packages that are **not** in CluauppLibs. Headers in `include/cluaupp/libs/` match the shipped Luau.

```cpp
#include <cluaupp/libs/dataservice.hpp>

void Grant(Player* player, int amount) {
	Data* data = DataService::Server.WaitFor(player);
	if (data == nullptr) {
		return;
	}
	int coins = data->Get(DataService::Server.Paths.Currencies.Money);
	data->Set(DataService::Server.Paths.Currencies.Money, coins + amount);
}
```

`Paths.Currencies.Money` exists because **your** Template passed to `Init` had that field. Full copies: [Examples](examples/index.md).

## Performance notes

- Prefer `const` and locals over recomputing in `RenderStepped`.
- `Net` already uses `buffer`. Batch when you can; do not fire per-heartbeat for every NPC.
- Module3D is a ViewportFrame — fine for shops and inventory, not for cloning the whole map (same advice as the [original Module3D thread](https://devforum.roblox.com/t/module3d-v61-viewportframe-implementation/207383)).
- Janitor `Cleanup` is O(tracked objects). Link to the Instance that owns the scope instead of a global janitor for the whole server.

## Good C++ conduct that still applies

1. **Initialize everything.** `int coins;` without a value is a bug; write `int coins = 0`.
2. **Small functions.** One behavior, named after the behavior.
3. **No magic numbers.** `const int MAX_INVENTORY = 20`.
4. **Early return.** Flatten `if` pyramids.
5. **Headers declare, scripts define.** Prototypes in `.h`, bodies in `.cpp`.
6. **Do not share mutable statics across server and client** — use Net or DataService.

See also: [syntax](syntax.md), [print and cout](print-cout.md), [libraries](libraries/index.md), [OOP](oop/index.md), [examples](examples/index.md), [comparison](comparison.md).
