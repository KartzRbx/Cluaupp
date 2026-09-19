---
title: Occlude
---

**Occlude** tests line-of-sight from the **camera** to an **adornee** with `WorldRoot:Raycast`. [Pin](/libraries/pin/) can enable occlusion so billboards hide behind walls. Default ray params **exclude** the adornee from hits.

Header: `#include <clpp/libs/occlude.clh>`. Runtime: `CluauppLibs.Occlude`. `--!native`.

## Why

**Use when:**

- Nameplates or quest markers should not show through terrain.
- You already have `WorldRoot`, `Camera`, and the target instance.

**Do not use when:**

- Hit detection or combat — server authority / [Flare](/libraries/flare/).
- The adornee has no resolvable world position (returns occluded / nil ray).

## Example CL++

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/occlude.clh>

[[client]]
void init() {
	Camera cam = workspace.CurrentCamera;
	Instance npc = workspace.FindFirstChild("NPC");
	bool blocked = Occlude.IsOccluded(workspace, cam, npc);
	bool clear = Occlude.Visible(workspace, cam, npc);
}
```

## API

### Occlude.Position

**Returns:** `Vector3` world point for the adornee, or nil if none (BasePart position, Model pivot, Attachment world position, or first BasePart descendant).

**When:** Custom debug draw or manual ray origin/goal checks.

```clpp
Vector3 p = Occlude.Position(part); // adornee center
```

### Occlude.Raycast

**Returns:** `RaycastResult` or nil if no position or no hit.

**When:** You need the hit instance/material, not just a bool.

```clpp
RaycastResult hit = Occlude.Raycast(workspace, camera, npc);
```

**Formula:** `origin = camera.CFrame.Position`, `direction = goal − origin`, `world:Raycast(origin, direction, params)` with default filter excluding `adornee`.

### Occlude.Raycast (params)

**Returns:** `RaycastResult` or nil.

**When:** Custom `RaycastParams` (include lists, collision groups).

### Occlude.IsOccluded

**Returns:** `bool` — `true` if no adornee position, or ray hits and hit is far enough from goal.

**When:** Hide UI when blocked.

```clpp
bool hidden = Occlude.IsOccluded(workspace, cam, npc); // slack default 2
```

**Formula:** Occluded when `hit ≠ nil` and `|hit.Position − goal| ≥ slack` (default slack `2` studs).

### Occlude.IsOccluded (params)

**Returns:** `bool`.

**When:** Filtered raycast without slack overload.

### Occlude.IsOccluded (params, slack)

**Returns:** `bool`.

**When:** Reduce flicker on grazing hits by raising slack.

### Occlude.Visible

**Returns:** `bool` — `not IsOccluded(...)`.

**When:** Readable guard for showing a pin or marker.

```clpp
if (Occlude.Visible(workspace, cam, npc)) { /* show label */ }
```

### Occlude.Visible (params)

**Returns:** `bool`.

**When:** Filtered visibility test.

### Occlude.Visible (params, slack)

**Returns:** `bool`.

**When:** Visibility with custom slack distance.
