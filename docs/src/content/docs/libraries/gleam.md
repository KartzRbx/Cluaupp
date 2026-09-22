---
title: Gleam
---

**Gleam** is the reactive HUD layer (Vide-style): a `GleamSource` holds value, `Gleam.Effect` re-runs when dependencies `Get`, list helpers rebuild via [Sweep](../sweep/), and `Gleam.Spring` steps [Coil](../coil/) on Heartbeat until settled. Props use `GleamProps { .Field = }` — no JSX, no template syntax inside structs. Callbacks are `func`.

Header: `#include <clpp/libs/gleam.clh>`. Runtime: `CluauppLibs.Gleam`.

## Why

**Use when:**

- Labels and frames should follow data (`coins.Set(50)` updates bound UI).
- You want Sweep-owned `Activated` / mount teardown without manual `:Disconnect()` lists.
- Smooth follow animations on sources via `Spring`.

**Do not use when:**

- Server economy or persistence — [Keep](../keep/) + [Flare](../flare/).
- Keyed list diffing — `Show` / `Indexes` / `Values` rebuild instances; mutating a table in place without `Set` does not notify.
- Studio debug panels — [Lens](../lens/).

## Example CL++

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/gleam.clh>
#include <clpp/libs/mint.clh>
#include <clpp/libs/bloom.clh>
#include <clpp/libs/keep.clh>

[[client]]
void init() {
	Keep.Client.Init();
	Data data = Keep.Client.WaitForData();
	GleamSource coins = Gleam.Source(data.Get(Keep.Client.Paths.Currencies.Coins));
	Players players = GetService<Players>();
	ScreenGui gui = Gleam.ScreenGui(GleamProps { .ResetOnSpawn = false });
	TextLabel label = Gleam.TextLabel(GleamProps {
		.Name = "Coins",
		.TextScaled = true,
	});
	Gleam.Mount(gui, players.LocalPlayer.PlayerGui);
	Gleam.Mount(label, gui);
	Gleam.Effect(func () {
		label.Text = Mint.Compact(coins.Get());
	});
	Bloom.Play(label, Bloom.Shine);
}
```

Full copy: [HUD example](../../examples/hud/).

`GleamProps` fields match Roblox GUI properties and event callbacks (`Activated`, `MouseButton1Click`, `Changed`, …) declared in `gleam.clh`.

## API

### GleamSource.Get

**Returns:** Current value; registers this `Effect` as dependent when called inside tracking.

**When:** Read state inside `Gleam.Effect` or `Gleam.Derive` compute.

```clpp
double v = coins.Get(); // tracks dependency
```

### GleamSource.Set

**Returns:** `void` — notifies effects and listeners when value changes (`==` skips).

**When:** Push new state from Keep, input, or network handlers.

```clpp
coins.Set(50); // reruns bound effects
```

### GleamSource.Listen

**Returns:** Unsubscribe `func` when invoked.

**When:** Side effects outside Gleam’s effect graph (logging, one-off sound).

```clpp
coins.Listen(func () { post("changed"); });
```

### Gleam.Source

**Returns:** `GleamSource` with initial value.

**When:** Root reactive cell; use `Gleam.Source(auto)` for inferred type.

```clpp
GleamSource n = Gleam.Source(0);
```

### Gleam.Derive

**Returns:** `GleamSource` updated when dependencies inside `compute` change.

**When:** Computed values without manual `Set` wiring.

```clpp
GleamSource doubled = Gleam.Derive(func () { return coins.Get() * 2; });
```

### Gleam.Effect

**Returns:** `void` — runs `fn` now and whenever dependencies change; Sweep-owned.

**When:** Sync instances to sources (text, visibility, layout).

### Gleam.Untrack

**Returns:** Value returned by `fn` without recording dependencies.

**When:** Read a source inside an effect without subscribing (logging, one-time branch).

### Gleam.Batch

**Returns:** `void` — batches multiple `Set` notifications until `fn` finishes.

**When:** Avoid N effect passes when updating several sources at once.

### Gleam.Cleanup

**Returns:** `void` — registers teardown on current effect scope.

**When:** Disconnect non-Gleam connections when effect re-runs or unmounts.

### Gleam.Create

**Returns:** `Instance` of `className`.

**When:** Rare classes beyond typed factories.

```clpp
Instance x = Gleam.Create("Frame");
```

### Gleam.Create (props)

**Returns:** `Instance` with `GleamProps` applied.

**When:** One-shot instance + props.

### Gleam.TextButton

**Returns:** `TextButton`.

**When:** Clickable control with optional `GleamProps` (`.Activated = func () { … }`).

### Gleam.TextButton (props)

**Returns:** `TextButton`.

### Gleam.TextLabel

**Returns:** `TextLabel`.

**When:** Static or effect-driven text.

### Gleam.TextLabel (props)

**Returns:** `TextLabel`.

### Gleam.Frame

**Returns:** `Frame`.

**When:** Layout container.

### Gleam.Frame (props)

**Returns:** `Frame`.

### Gleam.ScreenGui

**Returns:** `ScreenGui`.

**When:** Root under `PlayerGui`.

### Gleam.ScreenGui (props)

**Returns:** `ScreenGui`.

### Gleam.ImageLabel

**Returns:** `ImageLabel`.

**When:** Icons and thumbnails.

### Gleam.ImageLabel (props)

**Returns:** `ImageLabel`.

### Gleam.ScrollingFrame

**Returns:** `ScrollingFrame`.

**When:** Scrollable lists (often with `Indexes`).

### Gleam.ScrollingFrame (props)

**Returns:** `ScrollingFrame`.

### Gleam.List

**Returns:** `LuaArray<Instance>` — empty list helper for children arrays.

**When:** Building child lists for props.

### Gleam.List (a)

**Returns:** `LuaArray<Instance>` with one instance.

### Gleam.List (a, b)

**Returns:** `LuaArray<Instance>` with two instances.

### Gleam.List (a, b, c)

**Returns:** `LuaArray<Instance>` with three instances.

### Gleam.Mount

**Returns:** Unmount `func`.

**When:** Parent an instance; teardown unp mounts or destroys per runtime Sweep rules.

```clpp
Gleam.Mount(label, gui);
```

### Gleam.Root

**Returns:** Teardown `func` for entire reactive root.

**When:** Wrap bootstrap that creates multiple effects/mounts.

### Gleam.Show

**Returns:** `GleamSource` of current child instance (or nil).

**When:** Swap single child when source value changes; destroys previous instance.

### Gleam.Switch

**Returns:** `GleamSource` of active branch instance.

**When:** Enum-like UI where `map` keys select which builder runs.

### Gleam.Indexes

**Returns:** `GleamSource` of `{ Instance }` aligned to array source.

**When:** Render `{T}` lists; each item gets a nested source for row state.

### Gleam.Values

**Returns:** `GleamSource` of `{ Instance }` for dictionary/array values.

**When:** Like `Indexes` but callback receives value as well as item source.

### Gleam.Spring

**Returns:** `GleamSource` smoothed toward underlying source with default Coil tuning.

**When:** Animated position, size, or numbers bound to UI.

```clpp
GleamSource smooth = Gleam.Spring(coins);
```

**Formula:** Uses [Coil](../coil/) (`ω = frequency × 2π`) stepped each Heartbeat until settled.

### Gleam.Spring (speed)

**Returns:** `GleamSource` — `speed` maps to spring frequency (Hz).

**When:** Snappier or slower follow.

### Gleam.Spring (speed, damping)

**Returns:** `GleamSource` — explicit damping ratio and frequency.

**When:** Fine-tuned motion on HUD elements.

### Gleam.Action

**Returns:** `GleamAction` marker for prop tables (runtime runs on instance setup).

**When:** Imperative setup in props without storing raw Roblox connections yourself.

### Gleam.Apply (instance)

**Returns:** Callable `GleamApply`-style applier — `Apply(GleamProps)` mutates instance inside Sweep scope.

**When:** Update an existing instance from an effect.

```clpp
GleamApply patch = Gleam.Apply(label);
patch.Apply(GleamProps { .Text = "Hi" });
```

### Gleam.Apply (instance, props)

**Returns:** `Instance` after applying props once.

**When:** Single-shot patch without storing applier.

### GleamApply.Apply

**Returns:** `Instance` — applies `GleamProps` to the bound instance.

**When:** Returned from `Gleam.Apply(instance)` in CL++ as chained applier.
