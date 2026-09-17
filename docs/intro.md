---
title: Cluaupp
sidebar_position: 1
---

# Cluaupp

**CL++ on Roblox.** You write [CL++](https://kartzrbx.github.io/CLPP/). Cluaupp runs `clpp`, maps libraries into `ReplicatedStorage.CluauppLibs`, and syncs with Rojo.

This site covers the **toolchain** (`init`, `build`, `watch`, libs). The language course is on the [CL++ site](https://kartzrbx.github.io/CLPP/).

## What you get

1. CLI: `cluaupp init` / `build` / `watch`
2. First-party libraries in `ReplicatedStorage.CluauppLibs`
3. Rojo project mapping (`out/server`, `out/client`, `out/shared`)

## First program

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

void OnPlayer(Player* player) {
	guard (player != null) else {
		return;
	}
	Janitor* janitor = new Janitor();
	janitor::LinkToInstance(player);
}

void init() {
	Players* players = GetService<Players>();
	players::PlayerAdded~>Connect(OnPlayer);
}
```

Read [Getting started](getting-started.md), [syntax](syntax.md), and [migration](migration.md).
