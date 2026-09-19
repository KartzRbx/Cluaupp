---
title: Declarative UI
---

**Declarative UI in Cluaupp** is split by job: reactive HUD ([Gleam](/libraries/gleam/)), formatted numbers ([Mint](/libraries/mint/)), motion presets ([Bloom](/libraries/bloom/)), Studio topbar icons ([Crest](/libraries/crest/)), world billboards ([Pin](/libraries/pin/)), and ViewportFrame previews ([Stage](/libraries/stage/)). There is no JSX — use `GleamProps { .Field = }`, `func` callbacks, and `Gleam.Source(auto)` for state.

Debug panels are [Lens](/libraries/lens/) (`Lens.Window(title, draw)` — no `End()`). Line-of-sight for pins is [Occlude](/libraries/occlude/). Springs inside Gleam use [Coil](/libraries/coil/).

## Why

**Use this map when:**

- You need a HUD that tracks server or local state → **Gleam** (+ **Mint** for labels, **Bloom** for polish).
- You need Roblox topbar buttons that respect `TopbarInset` → **Crest** (`new Crest()`, not a separate Icon type).
- You need floating text over parts → **Pin** (+ optional **Occlude**).
- You need a rotating shop preview in a frame → **Stage** (or `Bloom.Viewport` which attaches **Stage**).

**Do not use:**

- **Mint** strings as economy storage or DataStore payloads — display only; reverse parsing is **`Mint.From`** for UI text, not persistence.
- **Bloom** / **Ember** for gameplay authority — cosmetic client effects only.
- **Lens** as an admin panel — server permissions stay on [Helm](/libraries/helm/).

## Example CL++

Pick one stack; full HUD copy: [HUD example](/examples/hud/).

```clpp
#include <clpp/libs/gleam.clh>
#include <clpp/libs/mint.clh>
#include <clpp/libs/bloom.clh>
#include <clpp/libs/crest.clh>

[[client]]
void init() {
	GleamSource coins = Gleam.Source(0);
	TextLabel label = Gleam.TextLabel(GleamProps { .Name = "Coins", .TextScaled = true });
	Gleam.Effect(func () {
		label.Text = Mint.Compact(coins.Get());
	});
	Bloom.Play(label, Bloom.Shine);

	Crest shop = new Crest();
	shop.setName("Shop").setRight().bindEvent("selected", func () { /* open UI */ });
}
```

## Library roles

| Library | What it is for |
| --- | --- |
| [Gleam](/libraries/gleam/) | Reactive instances, `Effect`, list helpers, `Spring` via Coil |
| [Mint](/libraries/mint/) | `12.5K`, `%`, scientific — label formatting only |
| [Bloom](/libraries/bloom/) | Shine, hover, fade, one Heartbeat scheduler for presets |
| [Crest](/libraries/crest/) | Topbar icon buttons, notify badge, select/deselect |
| [Pin](/libraries/pin/) | `BillboardGui` on an adornee with distance fade/scale |
| [Stage](/libraries/stage/) | Clone a model into a `ViewportFrame`, orbit with `Update` |

See each page for the full API from `#include <clpp/libs/*.clh>`.
