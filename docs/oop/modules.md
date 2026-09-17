---
title: Modules and structs
sidebar_position: 4
---

# Modules and structs

Use this when you want a **reusable object** without a tagged Script.

## Untagged `.cpp` = ModuleScript

```
src/shared/util/Coins.cpp
```

```cpp
#include <cluaupp/roblox.hpp>

int DoubleCoins(int coins) {
	return coins;
}
```

```
out/shared/util/Coins.luau   -- ModuleScript, exported functions
```

Quoted `#include "TemplateData.hpp"` is not inlined when the header has a sibling `.cpp` or is a shared module: `cluaupp build` emits `require(ReplicatedStorage.Cluaupp.constants.TemplateData)` / `require(ServerScriptService.Cluaupp.configurations.PlayerDataVersion)` (Rojo roots from `default.project.json`), never `script.Parent.Parent.shared`.

`.h` / `.hpp` are **type modules**. A service header becomes `export type Name = { init: (self: Name) -> (), … }` and a typed table. The sibling `.cpp` is the construction (`NameImpl.luau`); the header `require`s that impl and binds the functions. Data-only structs still emit a constructor so `TemplateData()` works. Untagged `.cpp` without a header is a ModuleScript other Luau can `require`. Prefer headers for the public type, tagged `.server.cpp` / `.client.cpp` for scripts, and the sibling `.cpp` for method bodies.

## Structs = data, not classes

The subset allows structs for IntelliSense and designated initializers (tables):

```cpp
struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};

TemplateData playerData = TemplateData {};
```

That is your “class fields”. Methods are **named functions** next to them (`EnsureStat`, `ApplyCurrencies`). Cluaupp does not emit `function TemplateData:GetMoney()`.

## Methods as functions

```cpp
void EnsureStat(Folder* folder, string name, int value) {
	auto* stat = folder->FindFirstChild(name);
	if (stat == nullptr) {
		cout::print << "EnsureStat: " << name << " not found" << endl;
		return;
	}
}
```

Pass the instance in (`folder`, `player`). That is composition: the Folder is the object, the function is the method.

## Janitor as the destructor

There is no C++ destructor. Pair “construct” with a Janitor:

```cpp
auto* janitor = new Janitor();
janitor->LinkToInstance(player);
janitor->Add(player->AncestryChanged.Connect(OnAncestry));
```

When the player leaves, `LinkToInstance` runs `Cleanup`. That is RAII for Roblox.

## Start / Stop

On generated services, `Main.Start` / `Main.Stop` are the constructor / destructor of the **system**. Put connections in Start (or in `init()` / `PlayersManager`). Do not leak `Connect` without a Janitor.

## What not to write

```cpp
class Shop {
	int price;
	void Buy(Player* player);
};
```

Custom classes are **not supported**. Split into a struct (fields) + functions (methods) + a `.server.cpp` or untagged module (lifetime).
