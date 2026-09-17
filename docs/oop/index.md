---
title: OOP structure
sidebar_position: 1
---

# Structs and methods

Live handbook: [Structs and methods](https://kartzrbx.github.io/Cluaupp/docs/structs.html). Singletons: [one table in `init()`](https://kartzrbx.github.io/Cluaupp/docs/singletons.html).

Cluaupp does **not** emit C++ `class` metatables. You write a **type** as a `struct` in a sibling header and implement `Class::Method` in the `.cpp`. Filename tags still decide Script / LocalScript / ModuleScript.

Construct **one** `LeaderstatsServer` in `void init()`, assign `janitor = new Janitor()`, and capture it in `[&]` lambdas. Library singletons already exist (`DataService::Server`) — `Init` once from a boot script. Join strings with `string_concat` or string `+`, not Luau `..`.

```cpp
#pragma once
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;
	Janitor* janitor;
	string GetPlayerJanitorKey(Player* player);
	void PlayerEntered(Player* player);
};
```

The stem must match: `LeaderstatsServer.h` next to `LeaderstatsServer.server.cpp`. `#include "leaderstats.h"` from a differently named cpp is a `require`, not the class body.

| Page | What you learn |
| --- | --- |
| [File tags](file-tags.md) | `.server` / `.client` / `.plugin` / `.legacy` / untagged |
| [Services](services.md) | One `.server.cpp` → one `.server.luau` |
| [Modules](modules.md) | Untagged files, structs, named functions as methods |

Planner: [Architecture](../architecture.md). Folder layout: [Organization](../cpp-organization.md). Full copy: [Leaderstats](../examples/leaderstats.md).
