---
title: HUD
sidebar_position: 6
---

# HUD

Live source: [`examples/game/src/client/hud.client.clpp`](../../examples/game/src/client/hud.client.clpp). Fusion API: [CL++](https://kartzrbx.github.io/CLPP/).

Client-only (`[[client]]`). `Fusion:scoped` / `Fusion:Value` / `Fusion:Computed` / `Fusion:New` build a coins label. `guard` fails if `LocalPlayer` is missing.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/fusion.clh>

[[client]]
void init() {
	Players* players = GetService<Players>();
	Player* localPlayer = players.LocalPlayer;
	guard (localPlayer != null) else {
		report("LocalPlayer missing");
		return;
	}
	auto scope = Fusion:scoped();
	auto coins = Fusion:Value(scope, 0);
	coins(100);
}
```
