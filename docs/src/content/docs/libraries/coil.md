---
title: Coil
---

**Coil** is a Fraktality damped spring. Frequency is **Hz** (not rad/s). [Gleam.Spring](../gleam/) builds Coil instances and steps them on Heartbeat.

Header: `#include <clpp/libs/coil.clh>`. Runtime: `CluauppLibs.Coil`. `--!native`.

## Why

**Use when:**

- Smooth UI or local motion (numbers, `Vector3`, `UDim2`, `Color3` component-wise).
- You control the timestep (`Heartbeat` / `Step(dt)`).

**Do not use when:**

- Replicated gameplay motion — use [Flare](../flare/) + [Echo](../echo/).
- `omega <= 0` or huge `dt` — spring intentionally no-ops or snaps to goal.

## Example CL++

```clpp
#include <clpp/libs/coil.clh>
#include <clpp/roblox.clh>

[[client]]
void init() {
	Coil spring = new Coil(0.7, 4, 0);
	spring.Set(1);
	spring.Impulse(8);
	RunService run = GetService<RunService>();
	run.Heartbeat~>Connect(func (double dt) {
		spring.Step(dt);
	});
}
```

## API

### Coil.New / `new Coil` (scalar)

**Returns:** `Coil` with `Goal`, `Position`, and `Velocity` initialized from `position`.

**When:** Single-axis HUD counters or opacity-like scalars.

```clpp
Coil s = new Coil(0.8, 3, 0); // damping, Hz, start
```

**Formula:** `ω = frequency × 2π`. If `ω ≤ 0`, `Step` is a no-op. If `dt ≥ 1` or decay envelope is huge, position snaps to `Goal`.

### Coil.New (Vector3)

**Returns:** `Coil` — three independent scalar springs on X/Y/Z.

**When:** Local part bob or camera offset in studs.

### Coil.New (UDim2)

**Returns:** `Coil` — four components (scale/offset per axis).

**When:** Animating GUI size or position with springs.

### Coil.New (Color3)

**Returns:** `Coil` — R/G/B components.

**When:** Color cross-fades without TweenService.

### Coil.Vector

**Returns:** `Coil` — same as `New` with `Vector3` (explicit helper).

**When:** Readability when constructing vector springs.

### Coil.UDim

**Returns:** `Coil` for `UDim2` initial state.

**When:** Same as `New(…, UDim2)`.

### Coil.UDim2

**Returns:** `Coil` — alias of `Coil.UDim`.

**When:** Name matches Roblox type.

### Coil.Color

**Returns:** `Coil` for `Color3` initial state.

**When:** Explicit color spring factory.

### Set / SetGoal

**Returns:** `void` — updates `Goal` only (velocity unchanged).

**When:** Target changed (menu open, new score). Overloads for `double`, `Vector3`, `UDim2`, `Color3`.

```clpp
spring.Set(1); // Goal = 1
```

### Get

**Returns:** Current `Position` (same type as constructed).

**When:** After each `Step`, read position for UI or CFrame.

```clpp
double x = spring.Get(); // current position
```

### Step

**Returns:** `void` — advances simulation by `dt` seconds.

**When:** Once per frame from `Heartbeat`. Invalid or non-positive `dt` is ignored.

**Formula:** Underdamped (`ζ < 1`): `ω_d = ω√(1−ζ²)`, position offset from goal is damped sinusoid. Critical (`ζ ≈ 1`) and overdamped use exponential modes per Fraktality. Component-wise for non-scalars.

### Impulse

**Returns:** `void` — adds to `Velocity`.

**When:** Punch on click, bounce landing. Scalar impulse adds to all components for vector types.

```clpp
spring.Impulse(5);
```

### Update

**Returns:** Current position after `Step(dt)`.

**When:** One-liner in a render loop.

```clpp
double p = spring.Update(dt); // Step + Get
```

### Fields

**Returns:** — `Damping`, `Frequency`, `Goal`, `Position`, `Velocity` are readable/writable on the struct per header.

**When:** Tuning or inspection; prefer `Set`/`Get` for goals and position.
