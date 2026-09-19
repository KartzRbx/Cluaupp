---
title: Stage
---

**Stage** clones a model into a `ViewportFrame` inside a GUI frame, frames it with an internal camera, and optional Y-orbit via `Update(dt)`. Not replication — live characters stay on [Echo](/libraries/echo/).

Header: `#include <clpp/libs/stage.clh>`. Runtime: `CluauppLibs.Stage`.

## Why

**Use when:**

- Shop item preview, codex 3D icon, or rotating showcase in UI.
- You need `SetCFrame`, depth multiplier, and Sweep-owned teardown.

**Do not use when:**

- The viewport should mirror another player’s live avatar in the world.
- Full-scene 3D — this is a framed preview clone only.

## Example CL++

```clpp
#include <clpp/libs/stage.clh>
#include <clpp/libs/gleam.clh>

[[client]]
void init() {
	Frame frame = Gleam.Frame(GleamProps { .Size = UDim2.fromOffset(200, 200) });
	Model sword = workspace.FindFirstChild("SwordPreview") :: Model;
	Stage preview = Stage.Attach(frame, sword);
	preview.SetDepthMultiplier(1.2);
}
```

## API

### Stage fields

**Returns:** — on each `Stage` instance: `Object3D`, `AdornFrame`, `Camera`, `Visible`, `Viewport`, `World`.

**When:** Access clone model, viewport, or world container for debugging.

### Stage.new_

**Returns:** `Stage` — creates holder frame and attaches model (runtime: internal `Attach`).

**When:** Preview without supplying your own frame.

### Stage.Attach

**Returns:** `Stage` — builds ViewportFrame under `frame`, clones `model` into `WorldModel`.

**When:** Gleam `Frame` or ScrollingFrame hosts the preview.

```clpp
Stage s = Stage.Attach(guiFrame, model);
```

### Stage.Attach3D

**Returns:** `Stage` — same as `Attach` (Module3D successor name).

**When:** Legacy naming in existing projects.

### Update

**Returns:** `void` — reframes camera at current orbit/CFrame.

**When:** Call from `Heartbeat` when not passing dt.

### Update (dt)

**Returns:** `void` — accumulates Y rotation by `dt` then reframes.

**When:** Spinning shop preview.

```clpp
preview.Update(dt); // orbit over time
```

### SetCFrame

**Returns:** `void` — sets relative camera offset from model center.

**When:** Fixed hero angle for catalog thumbnails.

### GetCFrame

**Returns:** `CFrame` — current relative offset.

**When:** Save/restore preview angle.

### SetDepthMultiplier

**Returns:** `void`.

**When:** Push camera farther/closer via depth factor (default `1`).

**Formula:** Camera distance scales with bounding extent, FOV, and `depth × 1.25 / tan(fov/2)` (runtime `distance()` helper).

### GetDepthMultiplier

**Returns:** `double`.

**When:** Read current depth factor.

### SetActive

**Returns:** `void`.

**When:** Hide viewport without destroying clone.

### GetActive

**Returns:** `bool`.

**When:** Skip `Update` when inactive.

### Destroy

**Returns:** `void` — Sweep destroys viewport subtree.

**When:** Close shop UI.

### End

**Returns:** `void` — alias of `Destroy` in runtime.

**When:** Same teardown, alternate name.
