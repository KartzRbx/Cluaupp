# C++ → Luau syntax

Cluaupp is not a full C++ compiler. It is a **subset** aimed at Roblox scripts, in the same spirit as roblox-ts (restricted TypeScript → Luau).

Generated Luau follows the current language: [`--!strict`](https://luau.org/getting-started), `local`, `const`, and `const function`. Injected `require` / `GetService` lines are `const`.

## Files

- Extensions: `.cpp`, `.h`, `.hpp` (also `.cc`, `.hh`)
- Quoted `#include "file.h"` is inlined (C preprocessor)
- `#include <cluaupp/roblox.hpp>` and `<cluaupp/libs/*.hpp>` are IntelliSense only; library headers also inject `require(CluauppLibs.*)`
- Other `#` lines (`#pragma once`) are ignored
- Function prototypes (`void foo();`) are skipped; only functions with a body are emitted

## Functions

```cpp
void CreateLeaderstats(Player* player) {
	return;
}

int doubleCoins(int coins) {
	return coins;
}
```

```luau
const function CreateLeaderstats(player: Player)
	return
end

const function doubleCoins(coins: number): number
	return coins
end
```

`void` omits a return annotation. `int` / `float` / `double` → `number`. `bool` → `boolean`. Roblox types (`Player`, `Folder`) keep their name.

If `void init()` exists, emit appends `init()` at the end of the file.

## Locals and const

Luau uses `local` for variables and `const` for constants. `const int` in C++ becomes `const` in Luau.

```cpp
int coins = 10;
const int STARTING_COINS = 0;
auto* folder = new Folder(player);
```

```luau
local coins: number = 10
const STARTING_COINS: number = 0
local folder: Folder = Instance.new("Folder")
folder.Parent = player
```

`auto` infers the type when the value is `new Class(...)` or `GetService<Service>()`.

## Control flow

```cpp
if (player->FindFirstChild("leaderstats") != nullptr) {
	return;
} else {
	print("ok");
}

while (true) {
	print("tick");
}

for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}
```

```luau
if player:FindFirstChild("leaderstats") ~= nil then
	return
else
	print("ok")
end

while true do
	print("tick")
end

for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end
```

The only `for` accepted today is **range-for**: `for (auto* x : list)`. C-style `for (int i = 0; i < n; i++)` is not supported yet.

## Expressions

| C++ | Luau |
| --- | --- |
| `nullptr` | `nil` |
| `true` / `false` | `true` / `false` |
| `!=` | `~=` |
| `&&` | `and` |
| `\|\|` | `or` |
| `==` `+` `-` `*` `/` `<` `>` `<=` `>=` | same |
| `"text"` | `"text"` |
| `obj->Prop` | `obj.Prop` |
| `obj->Method(a)` | `obj:Method(a)` if the method is a Roblox API |
| `fn(a)` | `fn(a)` |
| `signal.Connect(fn)` | `signal:Connect(fn)` |
| `Type { .Field = value }` | `{ Field = value }` |

Designated initializers become Luau tables. Nested braces work the same way:

```cpp
DataService::Server.Init(DataServiceOptions {
	.Template = playerData,
	.StoreName = "PlayerData",
	.UseMock = true,
});
```

```luau
DataService.Server:Init({
	Template = playerData,
	StoreName = "PlayerData",
	UseMock = true,
})
```

## `new` and services

```cpp
auto* coins = new IntValue(leaderstats);
auto* players = GetService<Players>();
```

```luau
local coins: IntValue = Instance.new("IntValue")
coins.Parent = leaderstats
local players: Players = game:GetService("Players")
```

The first argument of `new Class(parent)` becomes `.Parent`. With no argument: `Instance.new("Class")` only.

## print / cout

`print`, `warn`, and `error` work as in Luau. `cout << … << endl` is the C++ spelling — each `<<` is another argument, `endl` ends the line. `cout::warn` / `cout::error` / `cout::ping` pick the Roblox function.

```cpp
cout << "EnsureStat: " << name << " not found" << endl;
cout::print << "EnsureStat: " << name << " not found" << endl;
cerr << "failed";
cout::print("ok");
cout::warn("careful");
cout::error("fail");
cout::ping("here");
```

```luau
print("EnsureStat: ", name, " not found")
warn("failed")
print("ok")
warn("careful")
error("fail")
print("here")
```

Full table and IntelliSense notes: [print and cout](print-cout.md).

## Not supported yet

Custom C++ classes, generic templates besides `GetService<T>`, pointer arithmetic, `switch`, `std::`, overloading, macros (except skipping `#` lines).

If you need one of those patterns, open an issue with the C++ and the expected Luau.
