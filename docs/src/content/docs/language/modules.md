---
title: Modules
description: Canonical import { } from; angle includes stay Cluaupp host; no export keyword.
---

Use this when you want a **reusable object** without a tagged Script.

## Named `import` (canonical)

CL++ **0.8+** pulls another file’s symbols with a named import (RFC 0003). This is the **language** surface — prefer it over quoted `#include` for app modules:

```clpp
import { Wallet } from "./PlayerData.clh";
import { PlayerData as Data } from "./PlayerData.clh";
import { Wallet, PlayerData } from "./PlayerData.clh";
```

`PlayerData.clh`:

```clpp
#pragma once

struct Wallet {
	int Coins = 0;
};

struct PlayerDataCurrencies {
	int Coins = 0;
	int Rebirths = 0;
};

struct PlayerData {
	PlayerDataCurrencies Currencies;
};
```

Consumer:

```clpp
import { Wallet, PlayerData as Data } from "./PlayerData.clh";

void Demo() {
	Wallet w;
	w.Coins = 10;
	Data d;
	d.Currencies.Coins = w.Coins;
}
```

Rules:

- **No `export` keyword.** Every top-level `struct` / `class` / `interface` / `enum` / `type` / `using` / free function in the module file is importable.
- Privacy is `private:` inside a struct, not a file-level export list.
- `as` renames the binding in the consumer.
- Missing path → **CLPP0801**. Import cycle → **CLPP1001**.
- Emit: each import becomes a `require(...)` entry; Cluaupp/Rojo map the path into the DataModel.

| Feature | Status |
| --- | --- |
| `import { X } from "…"` | **Shipped** |
| `import { X as Y }` | **Shipped** |
| `import type { … }` | Not yet |
| `import * as M` | Not yet |

## Host `#include` only (not module require)

```clpp
#include <clpp/roblox.clh>      // Cluaupp prelude — NOT a language module
#include <clpp/libs/sweep.clh>  // IntelliSense + CluauppLibs require
```

| Need | Use |
| --- | --- |
| Types/functions from another CL++ file | `import { … } from "…"` |
| Header/impl pair same stem | `import { ... } from "./Foo.clh"` |
| Engine / generated / libs | `#include <clpp/…>` via Cluaupp |

`import` emits a Rojo-rooted `require(...)` (from `default.project.json`), never `script.Parent.Parent.shared`.

## Untagged `.clp` / `.clpp` = ModuleScript

```
Src/Modules/Shared/Coins.clp
```

```clpp
#include <clpp/roblox.clh>

int DoubleCoins(int coins) {
	return coins;
}
```

```
out/Modules/Shared/Coins.luau   -- ModuleScript, exported functions
```

`.clh` are **type modules**. A service header becomes a typed Luau table; the sibling `.clp` / `.clpp` is the construction. Data-only structs still emit a constructor so `TemplateData()` works. Prefer headers for the public type, tagged `.server.clpp` / `.client.clpp` for scripts, and the sibling `.clp` / `.clpp` for method bodies.

## Structs = data, not classes

```clpp
struct TemplateData {
	struct Currencies {
		int Money = 0;
		int Level = 1;
	} Currencies;
};

TemplateData playerData = TemplateData {};
```

Methods are **named functions** next to them. Cluaupp does not emit `function TemplateData:GetMoney()`.

## Janitor as the destructor

```clpp
auto janitor = new Janitor();
janitor.LinkToInstance(player);
janitor.Add(player.AncestryChanged~>Connect(OnAncestry));
```

When the player leaves, `LinkToInstance` runs `Cleanup`. That is RAII for Roblox.

## What not to write

```clpp
class Shop {
	int price;
	void Buy(Player player);
};
```

Custom classes are **not supported**. Split into a struct (fields) + functions (methods) + a `.server.clpp` or untagged module (lifetime).

See also: [Option and Result](../option-result/) · [Organization](../organization/).
