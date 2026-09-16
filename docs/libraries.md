---
title: Libraries
sidebar_position: 20
---

# Libraries

Cluaupp ships **full library systems** in `CluauppLibs` (`runtime/` → `libs/` on `cluaupp init` / `build`). These are not typings and not `require(Packages.*)` stubs. `cluaupp build` copies the Luau source. `#include <cluaupp/libs/...>` injects `require(ReplicatedStorage.CluauppLibs.<Name>)`.

Re-vendor from GitHub:

```bash
cd cluau
# clones live in vendor/ (gitignored)
node scripts/vendor-libs.js
```

Sources: [runtime/SOURCES.md](https://github.com/kartzDev/cluaupp/blob/main/runtime/SOURCES.md).

## Vendored from GitHub

| Library | Header | GitHub | What you get |
| --- | --- | --- | --- |
| **Janitor** | `<cluaupp/libs/janitor.hpp>` | [howmanysmall/Janitor](https://github.com/howmanysmall/Janitor) | Add / AddPromise / LinkToInstance / Cleanup |
| **Promise** | `<cluaupp/libs/promise.hpp>` | [evaera/roblox-lua-promise](https://github.com/evaera/roblox-lua-promise) | andThen + Cluaupp aliases Then / Catch / Await |
| **Fusion** | `<cluaupp/libs/fusion.hpp>` | [dphfox/Fusion](https://github.com/dphfox/Fusion) | scoped, New, Value, Computed, Spring, Tween |
| **Iris** | `<cluaupp/libs/iris.hpp>` | [SirMallard/Iris](https://github.com/SirMallard/Iris) | Immediate-mode debug UI |
| **Cmdr** | `<cluaupp/libs/cmdr.hpp>` | [evaera/Cmdr](https://github.com/evaera/Cmdr) | Command console (server module + CmdrClient) |
| **TopbarPlus** | `<cluaupp/libs/topbarplus.hpp>` | [1ForeverHD/TopbarPlus](https://github.com/1ForeverHD/TopbarPlus) | `Icon.new`, setLabel, dropdowns |
| **Chrono** | `<cluaupp/libs/chrono.hpp>` | [Parihsz/Chrono](https://github.com/Parihsz/Chrono) | Custom character replication (`Chrono.Start()`) |
| **DataService** | `<cluaupp/libs/dataservice.hpp>` | [KartzRbx/dataservicev2](https://github.com/KartzRbx/dataservicev2) | ProfileStore, QuickNet, Paths, Get vs GetPersisted |
| **EzVisualz** | `<cluaupp/libs/ezvisual.hpp>` | [arxkdev/ezVisualz](https://github.com/arxkdev/ezVisualz) | UIGradient presets (Rainbow, Gold, …) |
| **StateMachine** | `<cluaupp/libs/statemachine.hpp>` | [Prooheckcp/RobloxStateMachine](https://github.com/Prooheckcp/RobloxStateMachine) | States, transitions, LoadDirectory |
| **Spring** | `<cluaupp/libs/spring.hpp>` | [nightcycle/spring](https://github.com/nightcycle/spring) | Damped spring (`new(damping, frequency, position)`) |
| **Display** | `<cluaupp/libs/display.hpp>` | [nightcycle/display](https://github.com/nightcycle/display) | Pretty-print any value (`option` bundled) |
| **Module3D** | `<cluaupp/libs/module3d.hpp>` | [TheNexusAvenger/Module3D](https://github.com/TheNexusAvenger/Module3D) | Model in a ViewportFrame |
| **FormatNumber** | `<cluaupp/libs/formatnumber.hpp>` | [Blockzez/RobloxFormatNumber](https://github.com/Blockzez/RobloxFormatNumber) | ICU-style formatters + Abbreviate / Comma |

## Cluaupp originals

| Library | Header | Role |
| --- | --- | --- |
| **Net** | `<cluaupp/libs/net.hpp>` | Buffer-packed RemoteEvent / RemoteFunction |
| **MathUtils** | `<cluaupp/libs/math.hpp>` | Lerp, Map, Clamp, angles |
| **Twinkle** | `<cluaupp/libs/twinkle.hpp>` | UI fade / slide / zoom / bounce |
| **StickyBillboard** | `<cluaupp/libs/stickybillboard.hpp>` | BillboardGui on an adornee (no public GitHub) |
| **VfxUtil** | `<cluaupp/libs/vfx.hpp>` | Emit / Play / CloneOnto ParticleEmitters |
| **ArrayIndexer** | (types) | `Table<Manifest, "Name">` |
| **Occlude** | (types) | `Keys<Data, "field">` |

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include <cluaupp/libs/formatnumber.hpp>

void OnCoins(Player* player, int amount) {
	auto* stats = player->FindFirstChild("leaderstats");
	if (stats == nullptr) {
		return;
	}
}

void init() {
	auto* janitor = new Janitor();
	auto* coins = Net::Event("Coins");
	coins->On(OnCoins);
	print(FormatNumber::Abbreviate(1500));
	DataService::Server.Init(DataServiceOptions {
		.Template = { .Coins = 0 },
		.StoreName = "PlayerData",
	});
	janitor->Add(coins);
}
```

Wally is **optional**. The game template no longer depends on Wally for these packages. Add Wally only for extra community packages you want beside CluauppLibs.

Typed Luau borders live in `runtime/<Lib>/init.luau` (Janitor, Promise, Net, MathUtils, FormatNumber, Module3D, Twinkle). Engine classes: [API](https://kartzrbx.github.io/Cluaupp/api/classes/).
