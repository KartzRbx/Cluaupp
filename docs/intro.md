---
title: Cluaupp
sidebar_position: 1
---

# Cluaupp

**The definitive merge of C++ and modern Luau.** You write a C++ subset. Cluaupp emits [Luau](https://luau.org/getting-started) with `--!strict`, `local`, and `const`, and calls the Roblox API the way Studio does.

This site is built with [Moonwave](https://eryn.io/moonwave/) for local markdown (`npm run docs`). The **public** site is generated into `site/` and deployed to [GitHub Pages](https://kartzrbx.github.io/Cluaupp/) (Learn tabs, OOP, Examples, API). The language is in the same spirit as [roblox-ts](https://roblox-ts.com): a familiar syntax, a restricted subset, readable output.

## What you get

1. A compiler (`cluaupp init` / `build` / `watch`)
2. Headers for IntelliSense (`#include <cluaupp/roblox.hpp>`)
3. First-party libraries in `ReplicatedStorage.CluauppLibs`
4. Wally wrappers for DataServiceV2, Fusion, Cmdr, EzVisualz, TopbarPlus, and the rest of your stack

## First program

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>

void OnPlayer(Player* player) {
	auto* janitor = new Janitor();
	janitor->LinkToInstance(player);
	janitor->Add(player->AncestryChanged.Connect(OnPlayer));
}

void init() {
	auto* players = GetService<Players>();
	players->PlayerAdded.Connect(OnPlayer);
}
```

Read [Getting started](getting-started.md), then [Examples](examples/index.md), [Libraries](libraries/index.md), and [OOP structure](oop/index.md).
