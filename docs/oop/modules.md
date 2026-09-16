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

Shared **data and constants** belong in headers (`#include "TemplateData.hpp"`) — they are inlined. Untagged `.cpp` is for a ModuleScript other Luau can `require`. Prefer headers for data and tagged `.server.cpp` / `.client.cpp` for behavior.

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
