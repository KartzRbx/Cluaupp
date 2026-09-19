---
title: HUD
---

Gleam + Mint + Bloom. Client-only. Coins come from [Keep](/libraries/keep/) (`WaitForData`); the label is Mint; shine is Bloom; Sweep owns Activated.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/gleam.clh>
#include <clpp/libs/mint.clh>
#include <clpp/libs/bloom.clh>
#include <clpp/libs/keep.clh>
#include <clpp/libs/sweep.clh>

[[client]]
void init() {
	Players players = GetService<Players>();
	Player localPlayer = players.LocalPlayer;
	guard (localPlayer != null) else {
		report("LocalPlayer missing");
		return;
	}
	Keep.Client.Init();
	Data data = Keep.Client.WaitForData();
	GleamSource coins = Gleam.Source(data.Get(Keep.Client.Paths.Currencies.Coins));
	TextLabel label = Gleam.TextLabel(GleamProps { .Name = "Coins", .TextScaled = true });
	Gleam.Mount(label, localPlayer.PlayerGui);
	Gleam.Effect(func () {
		label.Text = Mint.Compact(coins.Get());
	});
	Bloom.Play(label, Bloom.Shine);
}
```

See [Gleam](/libraries/gleam/), [Mint](/libraries/mint/), [Bloom](/libraries/bloom/).
