---
title: Declarative UI
sidebar_position: 5
---

# Declarative UI

Live handbook (examples, C++ / Luau tabs): **[Declarative UI](https://kartzrbx.github.io/Cluaupp/docs/ui.html)**.

roblox-ts can compile [Roact JSX](https://roblox-ts.com/docs/guides/roact-jsx) because TypeScript has JSX. **Cluaupp does not.** There are no `<frame />` tags. You call the library the way Luau does: functions, designated-initializer tables, `func [](…)` callbacks.

## Pick a model

| When you want… | Use | In Cluaupp |
| --- | --- | --- |
| A few labels you set by hand | Imperative Instances | `new TextLabel(gui)` |
| UI that follows state | [Fusion](https://github.com/dphfox/Fusion) | Shipped: `#include <clpp/libs/fusion.clh>` |
| The same idea, sources | [Vide](https://github.com/centau/vide) | Not shipped — calling convention on the handbook |
| A virtual tree | Roact / [jsdotlua React](https://github.com/jsdotlua/react) | Not shipped — `createElement`, never JSX |
| Studio debug panels | [Iris](https://github.com/SirMallard/Iris) | Shipped: `#include <clpp/libs/iris.clh>` |
| Topbar / fade / rainbow | TopbarPlus, Twinkle, EzVisualz | Shipped — polish Instances you already have |

Fusion and Iris are in CluauppLibs. Vide and React/Roact are **not** vendored.

## JSX → Cluaupp

| roblox-ts JSX | Cluaupp |
| --- | --- |
| `<frame Size={u} />` | `React:createElement("Frame", { .Size = u })` |
| `<textlabel Key="Coins" />` | `.Key = "Coins"` on the props table |
| `Event={{ Activated: fn }}` | `.Event = { .Activated = fn }` |
| `<MyButton text="Buy" />` | `React:createElement(MyButton, { .text = "Buy" })` |

## Fusion (shipped)

```clpp
#include <clpp/libs/fusion.clh>

FusionScope scope = Fusion:scoped();
FusionState coins = Fusion:Value(0);
Fusion:New("TextLabel")({
	.Name = "Coins",
	.Parent = gui,
	.Size = UDim2:fromScale(1, 0.1),
});
```

Wire `coins(newValue)` from `DataService:Client` `GetChangedSignal(Paths.Currencies.Coins)`. Use `Computed` for strings, `Hydrate` for a ScreenGui that already exists in Studio, `Spring` / `Tween` for motion.

## Vide / React

Same subset: **no JSX**. Vide is `source` / `derive` / `create("TextLabel")({ .Parent = gui })`. React is `createElement("Frame", { .Key = "Child" }, child)` plus `Key`, `Ref`, `Change`, `Event` as table fields. Full copies with C++ / Luau tabs: the [handbook page](https://kartzrbx.github.io/Cluaupp/docs/ui.html).

## Iris (shipped, debug only)

```clpp
#include <clpp/libs/iris.clh>

void DrawEconomy() {
	if (Iris:Window("Economy")) {
		Iris:Text("Coins");
		Iris:End();
	}
}

void init() {
	Iris:Init();
	Iris:Connect(DrawEconomy);
}
```

Do not use Iris as the live player HUD. Pair every `Window` / `Tree` with `End()`.

## One owner per ScreenGui

Do not mount Fusion and React on the same gui. Twinkle / TopbarPlus / EzVisualz can decorate that owner’s Instances. Client code must not `Set` persisted DataService paths.
