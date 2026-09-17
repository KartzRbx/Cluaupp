---
title: More libraries
sidebar_position: 6
---

# More libraries

Same rule: include the header, call the API. `cluaupp build` already put the Luau in `CluauppLibs`.

## FormatNumber

```cpp
#include <cluaupp/libs/formatnumber.hpp>

print(FormatNumber::Abbreviate(1500));
print(FormatNumber::Comma(1500));
```

## MathUtils

```cpp
#include <cluaupp/libs/math.hpp>

double t = MathUtils::Lerp(0, 1, 0.5);
```

## Twinkle (UI)

```cpp
#include <cluaupp/libs/twinkle.hpp>

Twinkle::Fade(frame, true);
```

## Module3D

```cpp
#include <cluaupp/libs/module3d.hpp>

Module3D::Attach3D(viewport, model);
```

## VfxUtil

```cpp
#include <cluaupp/libs/vfx.hpp>

VfxUtil::Emit(root);
VfxUtil::Play(emitter);
```

## StickyBillboard

```cpp
#include <cluaupp/libs/stickybillboard.hpp>

auto* billboard = StickyBillboard::new_(adornee, gui);
billboard->SetText("Hello");
```

## Fusion / Iris / Cmdr / TopbarPlus / Chrono / EzVisualz / StateMachine / Spring / Display

Cluaupp has **no JSX**. Declarative UI is function calls. First-party: Fusion (reactive) and Iris (immediate-mode debug). Vide and Roact/React use the same C++ spelling (`createElement` / `source`), not `<frame />`. Handbook: [Declarative UI](https://kartzrbx.github.io/Cluaupp/docs/ui.html).

Include the matching `<cluaupp/libs/*.hpp>` and call the same names as the upstream README:

| Lib | Header | Upstream |
| --- | --- | --- |
| Fusion | `fusion.hpp` | [dphfox/Fusion](https://github.com/dphfox/Fusion) |
| Iris | `iris.hpp` | [SirMallard/Iris](https://github.com/SirMallard/Iris) |
| Cmdr | `cmdr.hpp` | [evaera/Cmdr](https://github.com/evaera/Cmdr) |
| TopbarPlus | `topbarplus.hpp` | [1ForeverHD/TopbarPlus](https://github.com/1ForeverHD/TopbarPlus) |
| Chrono | `chrono.hpp` | [Parihsz/Chrono](https://github.com/Parihsz/Chrono) |
| EzVisualz | `ezvisual.hpp` | [arxkdev/ezVisualz](https://github.com/arxkdev/ezVisualz) |
| StateMachine | `statemachine.hpp` | [Prooheckcp/RobloxStateMachine](https://github.com/Prooheckcp/RobloxStateMachine) |
| Spring | `spring.hpp` | [nightcycle/spring](https://github.com/nightcycle/spring) |
| Display | `display.hpp` | [nightcycle/display](https://github.com/nightcycle/display) |

## Types-only

`ArrayIndexer` (`Table<Manifest, "Name">`) and `Occlude` (`Keys<Data, "field">`) are used by generated `{Service}Types.luau`. You rarely include them from game C++.
