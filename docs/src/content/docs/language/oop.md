---
sidebar:
  order: 5
title: Structs and methods
---

Language details: [CL++](https://kartzrbx.github.io/CLPP/). Filename tags decide Script / LocalScript / ModuleScript.

Declare the type in a `.clh`, implement `Class::Method` in a `.clp` / `.clpp`. Capture one service table in `void init()`.

```clpp
#pragma once
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>

struct LeaderstatsServer {
	static constexpr int STARTING_COINS = 0;
	Janitor janitor;
	string GetPlayerJanitorKey(Player player);
	void PlayerEntered(Player player);
};
```

| Page | What you learn |
| --- | --- |
| [File tags](../files/) | `.server.clpp` / `.client.clpp` / `.clh` |
| [Services](../services/) | `init()` singletons |
| [Modules](../modules/) | shared `.clp` |
