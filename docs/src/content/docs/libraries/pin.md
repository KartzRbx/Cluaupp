---
title: Pin
---

**Pin** attaches a `BillboardGui` to an adornee and parents your `GuiObject` inside it. Optional distance fade, scale, and ray occlusion. Sweep-friendly `Destroy`.

Header: `#include <clpp/libs/pin.clh>`. Runtime: `CluauppLibs.Pin`.

## Why

**Use when:**

- Quest markers, NPC names, or floating prompts over parts/models.
- One Heartbeat drives fade/scale/occlusion instead of per-NPC scripts.

**Do not use when:**

- Secret or authoritative state (boss true HP) — client billboards are not security.
- Screen-fixed HUD — [Gleam](../gleam/).

## Example CL++

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/pin.clh>
#include <clpp/libs/gleam.clh>

[[client]]
void init() {
	Part npc = workspace.FindFirstChild("NPC") :: Part;
	TextLabel label = Gleam.TextLabel(GleamProps { .Text = "Quest" });
	Pin pin = new Pin(npc, label, PinOptions {
		.MaxDistance = 80,
		.Fade = true,
		.Scale = true,
		.Occlude = true,
	});
	pin.SetText("New objective");
}
```

## API

### Pin.new_ / `new Pin` (adornee, gui)

**Returns:** `Pin`.

**When:** Defaults for size, offset, fade, scale, occlude from runtime when options omitted.

```clpp
Pin p = new Pin(part, label);
```

### Pin.new_ (adornee, gui, PinOptions)

**Returns:** `Pin`.

**When:** Full control via `PinOptions` fields: `Name`, `Size`, `StudsOffset`, `StudsOffsetWorldSpace`, `MaxDistance`, `MinDistance` (reserved; BillboardGui has no MinDistance), `AlwaysOnTop`, `LightInfluence`, `Parent`, `Occlude`, `Fade`, `Scale`.

### SetText

**Returns:** `void`.

**When:** Update label on the hosted gui (TextLabel/TextButton/TextBox or first TextLabel descendant).

```clpp
pin.SetText("Hello"); // billboard text
```

### SetEnabled

**Returns:** `void`.

**When:** Hide pin without destroy (respects occlusion when re-enabled).

### SetMaxDistance

**Returns:** `void`.

**When:** Clamp visibility range and fade curve.

### Destroy

**Returns:** `void`.

**When:** Disconnect Heartbeat and destroy billboard.

### Adornee

**Returns:** `Instance` field — target instance.

**When:** Read which world object is pinned.

### Gui

**Returns:** `GuiObject` field — your content root.

**When:** Further Gleam/Bloom styling on the inner gui.

### Billboard

**Returns:** `BillboardGui` field — Roblox billboard instance.

**When:** Rare direct property tweaks (prefer options at construction).
