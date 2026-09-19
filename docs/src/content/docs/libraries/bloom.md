---
title: Bloom
---

**Bloom** is UI motion: gradient presets (shine, rainbow), size motion (grow, bounce), tweens (fade, hover, press), and helpers that delegate to [Stage](/libraries/stage/) for viewports. One shared Heartbeat steps active preset jobs.

Header: `#include <clpp/libs/bloom.clh>`. Runtime: `CluauppLibs.Bloom`. Optional `.bloom` schemas bake named presets.

## Why

**Use when:**

- Polish on Gleam-built buttons and labels without hand-written Tween loops.
- Many simultaneous effects — scheduler skips hidden/unparented targets.

**Do not use when:**

- Gameplay timing or hitboxes — cosmetic only.
- You need full reactive UI — pair with [Gleam](/libraries/gleam/).

## Example CL++

```clpp
#include <clpp/libs/bloom.clh>
#include <clpp/libs/gleam.clh>

[[client]]
void init() {
	TextButton button = Gleam.TextButton();
	BloomHandle shine = Bloom.Play(button, Bloom.Shine);
	Bloom.Hover(button);
	Bloom.Press(button);
}
```

## API

### Preset constants

**Returns:** `string` preset names for `Play`.

**When:** Pass to `Bloom.Play` — `Bloom.Shine`, `Bloom.Rainbow`, `Bloom.ChromeStroke`, `Bloom.Grow`, `Bloom.Lift`, `Bloom.Bounce`, `Bloom.Shrink`, `Bloom.Punch`.

### Bloom.Stop

**Returns:** `ColorSequenceKeypoint` at time `t` with `color`.

**When:** Build custom gradients for `BloomOptions.Gradient`.

```clpp
ColorSequenceKeypoint k = Bloom.Stop(0, Color3.fromRGB(255, 200, 0));
```

### Bloom.Gradient

**Returns:** `ColorSequence` from keypoints.

**When:** Pass via `BloomOptions { .Gradient = Bloom.Gradient(...) }`.

### Bloom.Play

**Returns:** `BloomHandle` — shared Heartbeat job; `Pause` / `Resume` / `Destroy`.

**When:** Continuous shine/rainbow/chroma stroke or motion presets on a `GuiObject`.

```clpp
BloomHandle h = Bloom.Play(label, Bloom.Shine);
```

**Formula (motion presets):** `wave = sin(2π · offset)` or `|sin|` for bounce; size scales by `1 + (peak−1)·wave`; optional vertical lift from origin position.

### Bloom.Play (options)

**Returns:** `BloomHandle`.

**When:** Override `BloomOptions` — `Speed`, `Size`, `Gradient`, `Transparency`.

### BloomHandle.Pause

**Returns:** `void`.

**When:** Freeze animation while keeping instances.

### BloomHandle.Resume

**Returns:** `void`.

**When:** Continue after pause.

### BloomHandle.Destroy

**Returns:** `void` — removes gradients/strokes, restores size/position for motion presets.

**When:** Target removed from UI or effect no longer needed.

### BloomHandle.Instance

**Returns:** `GuiObject` field — animated target.

**When:** Inspect which gui is bound.

### Bloom.Fade

**Returns:** `void` — tweens `BackgroundTransparency`; hides when fading out.

**When:** Simple show/hide panels.

```clpp
Bloom.Fade(frame, true); // show
```

### Bloom.Fade (speed)

**Returns:** `void`.

**When:** Custom tween duration (default ~0.25s).

### Bloom.Slide

**Returns:** `void` — runtime delegates to `Fade`.

**When:** Named “slide” in UI code; same fade behavior.

### Bloom.Slide (speed)

**Returns:** `void`.

### Bloom.Zoom

**Returns:** `void` — scale size in/out with tween.

**When:** Pop-in menus.

### Bloom.Zoom (speed)

**Returns:** `void`.

### Bloom.Bounce

**Returns:** `void` — brief overscale Back easing on size.

**When:** Attention on a button.

### Bloom.Bounce (speed)

**Returns:** `void`.

### Bloom.Hover

**Returns:** `void` — MouseEnter/Leave size tweens (default scale up).

**When:** Desktop hover affordance on buttons.

### Bloom.Hover (kind)

**Returns:** `void` — `Bloom.Lift` uses smaller scale than default.

**When:** Subtle vs strong hover.

### Bloom.Press

**Returns:** `void` — shrink on MouseButton1Down (GuiButton only).

**When:** Tactile button feedback.

### Bloom.Press (kind)

**Returns:** `void` — `Bloom.Punch` deeper shrink.

**When:** Heavy click feel.

### Bloom.Ripple

**Returns:** `void` — click ripple frame on GuiButton.

**When:** Material-like feedback.

### Bloom.Tilt

**Returns:** `void` — RenderStepped rotation from mouse position.

**When:** Playful card tilt; optional `degrees` cap.

### Bloom.Tilt (degrees)

**Returns:** `void`.

**When:** Limit max rotation.

### Bloom.Depth

**Returns:** `void` — lift hover + subtle stroke.

**When:** Card “depth” without full preset.

### Bloom.Flip

**Returns:** `void` — horizontal squash flip tween.

**When:** Transition flair.

### Bloom.Flip (speed)

**Returns:** `void`.

**When:** Faster flip cycle.

### Bloom.Viewport

**Returns:** `Stage` — `Stage.Attach(frame, model)`.

**When:** 3D preview inside a gui frame (see [Stage](/libraries/stage/)).

### Bloom.Type

**Returns:** `void` — typewriter via `MaxVisibleGraphemes`.

**When:** Dialog text reveal in a `Frame` + `TextLabel`.

### Bloom.Sequence

**Returns:** `void`.

**When:** Header-declared sequencer entry (runtime runs queued steps when provided).

### Bloom.FrameSlide

**Returns:** `void` — alias of `Slide`.

**When:** Legacy name.

### Bloom.FrameZoom

**Returns:** `void` — alias of `Zoom`.

### Bloom.FrameBounce

**Returns:** `void` — alias of `Bounce`.

### Bloom.SetButtonStyle

**Returns:** `void` — alias of `Hover`.

### Bloom.ShowText

**Returns:** `void` — alias of `Type`.
