---
title: Axiom
---

**Axiom** is combat / camera / HUD math: clamp, lerp, easing, noise, CFrame look-at. Every public function returns a **concrete** type (`number`, `boolean`, `Vector3`, `CFrame`, `Color3`, …) — never `any`, never `nil` on the math path.

Header: `#include <clpp/libs/axiom.clh>`. Runtime: `CluauppLibs.Axiom`. `--!native`. `MathUtils` is the same module (legacy name).

A `.axiom` file lists **groups** so generated `out/` copies only those functions via `Axiom.Select`.

## Why

**Use when:** HUD bars, camera bob, projectile arcs, local juice (easing, bezier, value-noise).

**Do not use when:** economy rolls or loot — [Keep](/libraries/keep/) owns persisted RNG. Networked motion is [Flare](/libraries/flare/) + [Echo](/libraries/echo/), not a client lerp.

## Example

```clpp
#include <clpp/libs/axiom.clh>

void init() {
	double alpha = Axiom.Clamp(0.4, 0, 1);                 // 0.4
	Vector3 p = Axiom.LerpVector3(Vector3::zero, Vector3::one, alpha);
	double ease = Axiom.Smoothstep(0, 1, alpha);           // 0.352
}
```

## Schema (`HudMath.axiom`)

```
opt name = HudMath
group Scalar
group Lerp
group Easing
```

That emits `Axiom.Select({ "Scalar", "Lerp", "Easing" })`. Unknown group names error.

**Groups:** `Scalar` `Lerp` `Vector` `CFrame` `Easing` `Bezier` `Geometry` `Trig` `Probability` `Noise` `Color`.

Aliases always present on the full module: `LerpVector` = `LerpVector3`, `Random` = `RandomRange`, `AngleDiff` = `DeltaAngle`.

---

## API — Scalar

### Clamp

**Returns:** `double` — `value` forced into `[min, max]`.

**When:** HP, alpha, ammo, slider thumbs.

**Formula:** `clamp(x, a, b) = min(max(x, a), b)`

```clpp
Axiom.Clamp(12, 0, 10);  // 10
Axiom.Clamp(-1, 0, 10);  // 0
Axiom.Clamp(3, 0, 10);   // 3
```

### Map

**Returns:** `double` — `value` remapped from `[inMin, inMax]` to `[outMin, outMax]`. If `inMax == inMin`, returns `outMin`.

**When:** health → bar fill, studs → UI pixels.

**Formula:** `out = outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin)`

```clpp
Axiom.Map(50, 0, 100, 0, 1);  // 0.5
```

### Wrap

**Returns:** `double` in `[min, max)`. Range `0` returns `min`.

**When:** angles, cyclic indices, carousel slots.

**Formula:** `wrap(x) = min + ((x - min) mod (max - min))` with negative mods corrected.

```clpp
Axiom.Wrap(370, 0, 360);  // 10
```

### Sign

**Returns:** `1`, `-1`, or `0`.

**When:** knockback direction, facing.

**Formula:** `sign(x) = 1 if x>0, -1 if x<0, else 0`

```clpp
Axiom.Sign(-8);  // -1
Axiom.Sign(0);   // 0
```

### Round

**Returns:** `double` rounded half-up. Optional `digits` is decimal places.

**When:** display numbers before [Mint](/libraries/mint/), grid placement.

**Formula:** `round(x, p) = floor(x * 10^p + 0.5) / 10^p`

```clpp
Axiom.Round(1.55);     // 2
Axiom.Round(1.234, 2); // 1.23
```

### Snap

**Returns:** `double` snapped to `step`. `step == 0` returns `value`.

**When:** building grids, UI pixel snap.

**Formula:** `snap(x, s) = floor(x/s + 0.5) * s`

```clpp
Axiom.Snap(13, 5);  // 15
```

### PingPong

**Returns:** `double` bouncing between `0` and `length`.

**When:** idle bob, patrol that turns around without extra state.

**Formula:** triangle wave: `length - | (t/length mod 2)*length - length |`

```clpp
Axiom.PingPong(0.25, 1);  // 0.5
Axiom.PingPong(1.25, 1);  // 0.5
```

### Saturate

**Returns:** `double` in `[0, 1]`.

**When:** alpha, blend weights.

**Formula:** `saturate(x) = clamp(x, 0, 1)`

```clpp
Axiom.Saturate(1.4);  // 1
```

### Fract

**Returns:** fractional part in `[0, 1)` for positives.

**When:** tiling noise, looping 0–1 timers.

**Formula:** `fract(x) = x - floor(x)`

```clpp
Axiom.Fract(3.25);  // 0.25
```

### InvLerp

**Returns:** `double` — how far `value` sits between `from` and `to`. Equal endpoints return `0`.

**When:** progress bars, inverse of Lerp.

**Formula:** `invLerp(a, b, v) = (v - a) / (b - a)`

```clpp
Axiom.InvLerp(10, 20, 15);  // 0.5
```

### Approach

**Returns:** `current` moved toward `target` by at most `maxDelta`.

**When:** frame-rate independent chase without overshoot (camera follow, heat).

**Formula:** `approach = current + clamp(target - current, -maxDelta, maxDelta)`

```clpp
Axiom.Approach(0, 10, 3);  // 3
Axiom.Approach(9, 10, 3);  // 10
```

### IsFinite

**Returns:** `bool` — not NaN and not ±inf.

**When:** guard before writing a number to Keep or a remote.

```clpp
Axiom.IsFinite(1.0/0.0);  // false
```

### Abs / Min / Max / Pow / Sqrt / Cbrt / Hypot / Log / Exp

**Returns:** `double`.

**When:** same cases as `math.*`, but typed and `--!native`.

**Formulas:** `|x|`, `min`, `max`, `a^b`, `√x`, `∛x` (sign-preserving), `√(a²+b²)`, `ln(x)`, `e^x`.

```clpp
Axiom.Hypot(3, 4);  // 5
Axiom.Cbrt(-8);     // -2
Axiom.Pow(2, 10);   // 1024
```

### Smoothstep

**Returns:** `double` in `[0, 1]` with zero derivative at the edges.

**When:** camera ease-in-out, fog, HUD fades. Prefer this over raw lerp for motion that should not pop.

**Formula:** `t = saturate((x-edge0)/(edge1-edge0));  t²(3-2t)` Hermite.

```clpp
Axiom.Smoothstep(0, 1, 0.5);  // 0.5
Axiom.Smoothstep(0, 1, 0.25); // 0.15625
```

### Smootherstep

**Returns:** `double` in `[0, 1]` — Ken Perlin’s 5th-order smoothstep (zero 1st and 2nd derivatives at edges).

**When:** longer camera blends where Smoothstep still feels linear in the middle.

**Formula:** `t³(t(6t - 15) + 10)` with the same saturated `t`.

```clpp
Axiom.Smootherstep(0, 1, 0.5);  // 0.5
```

### Gcd / Lcm

**Returns:** `double` (Euclid). `Lcm` is `0` if gcd is `0`.

**When:** grid snapping of two cell sizes, repeating VFX periods.

**Formulas:** Euclidean algorithm; `lcm(a,b) = |a b| / gcd(a,b)`.

```clpp
Axiom.Gcd(12, 8);  // 4
Axiom.Lcm(12, 8);  // 24
```

### IsEven / IsOdd

**Returns:** `bool` (`value % 2 == 0` / `!= 0`).

**When:** checkerboard tiles, alternating lanes.

```clpp
Axiom.IsEven(4);  // true
Axiom.IsOdd(4);   // false
```

### Factorial

**Returns:** `double` — `floor(n)!` (`1` for `n < 2`).

**When:** combo tables, small n only (overflows fast).

**Formula:** `n! = 1·2·…·n`

```clpp
Axiom.Factorial(5);  // 120
```

### Scale

**Returns:** `double`.

**When:** UI scale rungs without a lookup table (0–49 cycle).

**Formula:** `Scale(value, n) = value * ((n mod 50) + 1) / 50`

```clpp
Axiom.Scale(100, 0);  // 2    — (0 % 50)+1 = 1 → 100 * 1/50
Axiom.Scale(100, 49); // 100  — (49 % 50)+1 = 50 → 100 * 50/50
```

---

## API — Lerp

### Lerp

**Returns:** `double`.

**When:** any blend that may overshoot (`alpha` not clamped).

**Formula:** `lerp(a, b, t) = a + (b - a) t`

```clpp
Axiom.Lerp(0, 10, 0.25);  // 2.5
Axiom.Lerp(0, 10, 2);     // 20
```

### LerpClamped

**Returns:** `double` — same with `t` saturated to `[0, 1]`.

**When:** health bars, doors — never go past the end.

```clpp
Axiom.LerpClamped(0, 10, 2);  // 10
```

### LerpVector2 / LerpVector3 / LerpVector / LerpColor3 / LerpCFrame / LerpUDim2

**Returns:** the matching Roblox type (`LerpVector` is `LerpVector3`).

**When:** positions, colors, poses, GUI boxes. Use the typed name — do not jam everything through `Lerp`.

**Formula:** component (or CFrame) lerp: `(1-t) a + t b`.

```clpp
Axiom.LerpVector3(Vector3::zero, Vector3::one, 0.5);  // (0.5, 0.5, 0.5)
```

### LerpAngle

**Returns:** `double` radians, shortest-arc.

**When:** yaw, turret turn, spin UI. Never lerp degrees with plain `Lerp` across 359→1.

**Formula:** `from + DeltaAngle(from, to) * alpha`

```clpp
Axiom.LerpAngle(0, 3.14159, 0.5);
```

### Inverse

**Returns:** `double` — alias of `InvLerp`.

**When:** same as InvLerp; older MathUtils name.

---

## API — Vector / CFrame

### Project

**Returns:** `Vector3` — `a` onto `b`. Degenerate `b` → `Vector3.zero`.

**When:** move along a rail, slide on a wall tangent.

**Formula:** `proj_b a = â_b (a · â_b)`

```clpp
Axiom.Project(Vector3::xAxis * 2, Vector3::xAxis);  // (2, 0, 0)
```

### Reject

**Returns:** `Vector3` — `a - Project(a, b)` (component orthogonal to `b`).

**When:** keep motion after removing the floor normal.

### Reflect

**Returns:** `Vector3`.

**When:** bullets, dashes off walls. `normal` should be unit.

**Formula:** `R = I - 2 (I · N) N`

```clpp
Axiom.Reflect(Vector3::zAxis, Vector3::yAxis);
```

### Angle

**Returns:** `double` radians between two vectors.

**When:** cone checks, facing.

**Formula:** `acos(clamp(â · ˆb, -1, 1))`

### Distance / Distance2

**Returns:** `double` (`Vector3` / `Vector2` magnitude of `b - a`).

**When:** aggro range, pickup radius. Prefer this over subtracting then `.Magnitude` in HUD code you want `--!native`.

```clpp
Axiom.Distance(Vector3::zero, Vector3::one);  // sqrt(3)
```

### Orthonormal

**Returns:** `CFrame` at origin looking along `forward`, `up` default `Y`.

**When:** build a basis for a beam or camera without shearing.

### Slerp

**Returns:** `Vector3` spherical lerp (direction + blended magnitude). Near-parallel falls back to linear.

**When:** rotating a facing vector. For poses use `SlerpCFrame`.

**Formula:** `sin`/`cos` of `θ t` on the great circle; `θ = acos(â · ˆb)`.

### SlerpCFrame

**Returns:** `CFrame` — Roblox `a:Lerp(b, t)` (quaternion lerp).

**When:** camera cut blends, door hinges.

### LookAt

**Returns:** `CFrame.lookAt(from, look)`.

**When:** NPC head, billboard, turret. Pair with `Flat` if you must stay Y-up on slopes.

### Flat

**Returns:** `CFrame` at the same position, look flattened to XZ (Y-up). Degenerate look → `-Z`.

**When:** character facing on hills so they do not tilt into the ground.

---

## API — Easing

All easings take `t` in any range, **clamp it to `[0, 1]`**, and return `double` in `[0, 1]` (Back/Elastic/Bounce may overshoot inside that after the clamp of *input*). Penner / easings.net formulas.

**When:** Tween-like HUD without TweenService. `In*` starts slow, `Out*` ends slow, `InOut*` both. `Linear` is `clamp(t,0,1)`.

| Call | Formula (after `t = clamp(t,0,1)`) |
| --- | --- |
| `InSine` | `1 - cos(t π / 2)` |
| `OutSine` | `sin(t π / 2)` |
| `InOutSine` | `-(cos(π t) - 1) / 2` |
| `InQuad` | `t²` |
| `OutQuad` | `1 - (1-t)²` |
| `InCubic` | `t³` |
| `OutCubic` | `1 - (1-t)³` |
| `InQuart` | `t⁴` |
| `InQuint` | `t⁵` |
| `InExpo` | `0 if t=0 else 2^(10t-10)` |
| `OutExpo` | `1 if t=1 else 1 - 2^(-10t)` |
| `InCirc` | `1 - √(1-t²)` |
| `OutCirc` | `√(1-(t-1)²)` |
| `InBack` | `2.70158 t³ - 1.70158 t²` |
| `InElastic` | `-2^(10t-10) sin((10t-10.75) 2π/3)` (`0`/`1` at ends) |
| `OutBounce` | piecewise `7.5625 t²` (d=2.75) |
| `InBounce` | `1 - OutBounce(1-t)` |
| `Linear` | `t` |

`InOut*` splits at `0.5` and scales the In/Out piece. `Out*` of power easings is `1 - (1-t)^n`.

```clpp
Axiom.OutQuad(0.5);    // 0.75
Axiom.InOutSine(0.5);  // 0.5
Axiom.Linear(2);       // 1
```

---

## API — Bezier / motion juice

### CubicBezier

**Returns:** `Vector3` on the cubic Bézier.

**When:** missile arcs, camera tracks with two handles.

**Formula:** `(1-t)³ P0 + 3(1-t)² t P1 + 3(1-t) t² P2 + t³ P3`

```clpp
Axiom.CubicBezier(0, p0, p1, p2, p3);  // p0
Axiom.CubicBezier(1, p0, p1, p2, p3);  // p3
```

### QuadraticBezier

**Returns:** `Vector3`.

**When:** one-handle jumps.

**Formula:** `(1-t)² P0 + 2(1-t)t P1 + t² P2`

### Hover / Float

**Returns:** `CFrame.lookAt(anchor + (0, bob, 0), look)`.

**When:** pickup gems, shop items. Hover uses `sin(elapsed * 1.6) * 0.22`; Float uses `sin(elapsed * 1.1) * 0.18`.

**Formula:** `bob = sin(ω t) · A`

### FloatSpin

**Returns:** `CFrame` — Float bob plus yaw `50° * elapsed`.

**When:** coins in the air.

---

## API — Geometry

### AabbContains

**Returns:** `bool` — point inside inclusive AABB `[min, max]`.

**When:** zone checks, hitboxes that are boxes.

```clpp
Axiom.AabbContains(Vector3::zero, Vector3::one * -1, Vector3::one);  // true
```

### SphereContains

**Returns:** `bool` — `\|p - c\| ≤ r`.

**When:** explosion radius, pickup.

### RayPlane

**Returns:** `Vector3` hit point. **Parallel or behind the ray → `Vector3.zero`** (never `nil`).

**When:** mouse-to-ground, water plane. Test `Magnitude` or a sentinel if zero origin is a valid hit.

**Formula:** `t = ((point - origin) · N) / (dir · N)`; hit = `origin + dir t` if `t ≥ 0`.

### Barycentric

**Returns:** `Vector3(u, v, w)` with `u + v + w = 1` (`u` at `a`, `v` at `b`, `w` at `c`). Degenerate triangle → `(1, 0, 0)`.

**When:** triangle hit interpolation (color, UV, height). Point is inside if all of `u,v,w ≥ 0`.

**Formula:** `v = (d11 d20 - d01 d21) / denom`, `w = (d00 d21 - d01 d20) / denom`, `u = 1 - v - w`.

### ClosestPointOnSegment

**Returns:** `Vector3` on segment `a–b` closest to `p`.

**When:** rope IK, rail grind, NPC stay-on-path.

**Formula:** `t = clamp((p-a)·(b-a) / \|b-a\|², 0, 1)`; `a + (b-a) t`

---

## API — Trig

### Deg / Rad

**Returns:** `double`. `deg = rad * 180/π`, `rad = deg * π/180`.

**When:** converting Tween/UI degrees to `CFrame.Angles`.

```clpp
Axiom.Deg(Axiom.Rad(90));  // 90
```

### DeltaAngle / AngleDiff

**Returns:** `double` shortest signed delta in **radians**, range `(-π, π]`.

**When:** turn-to-face. `AngleDiff` is the same function.

**Formula:** `((to - from + π) mod 2π) - π`

### DeltaAngleDegrees

**Returns:** signed degrees in `(-180, 180]`.

**When:** the same, if your data is already degrees.

### NormalizeAngle

**Returns:** radians wrapped to `[-π, π)`.

**When:** storing facing so it does not grow forever.

### Sin / Cos / Tan / Asin / Acos / Atan2

**Returns:** `double` — `math.*` wrappers, radians in / out.

**When:** call Axiom so `.axiom` tree-shake still includes trig with Scalar/Easing.

```clpp
Axiom.Atan2(1, 0);  // π/2
```

---

## API — Probability / Noise / Color

### RandomRange / Random

**Returns:** `double` in `[min, max)` (Luau `math.random`).

**When:** VFX jitter, camera shake. **Not** loot or coins.

**Formula:** `min + (max-min) * U(0,1)`

### Weighted

**Returns:** `int` 1-based index. Empty list → `0`. Non-positive total → `1`.

**When:** weighted emotes, local juice tables — still not economy.

```clpp
Axiom.Weighted({ 1, 3, 0 });  // 1 or 2, never 3
```

### Gaussian

**Returns:** `double` ~ N(`mean` or 0, `std` or 1). Box–Muller.

**When:** recoil spread, damage juice (display). Not DataStore rolls.

**Formula:** `√(-2 ln U) cos(2π V) * std + mean`

### Average / Sum

**Returns:** `double`. Empty average is `0`, empty sum is `0`.

**When:** DPS meters, ping smoothing.

```clpp
Axiom.Average({ 2, 4, 6 });  // 4
Axiom.Sum({ 2, 4, 6 });      // 12
```

### HashU32

**Returns:** `double` in `0 .. 2³²-1` (integer-valued).

**When:** stable id from a number (chunk keys). Deterministic.

### Value1 / Value2 / Value3

**Returns:** `double` in `[0, 1)` from `HashU32 / 2³²`.

**When:** cheap value-noise for grass sway, **not** cryptography.

```clpp
Axiom.Value1(10);           // same every session
Axiom.Value2(chunkX, chunkZ);
```

### FromHSV

**Returns:** `Color3` (`h,s,v` in `[0,1]`).

**When:** rainbow strokes, team hues.

### Contrast

**Returns:** `Color3` pushed away from 0.5 gray, then clamped.

**When:** hit flash, accessibility contrast kick.

**Formula:** `clamp((c - 0.5) * amount + 0.5, 0, 1)` per channel.

### LerpHSV

**Returns:** `Color3` — hue takes the **short arc**, S/V lerp linearly.

**When:** health green→red without crossing the rainbow.

---

## MathUtils

Same runtime as Axiom. Header aliases: `Lerp`, `Map`, `Clamp`, `Round`, `Snap`, `Sign`, `Wrap`, `Saturate`, `Inverse`, `AngleDiff`, `LerpAngle`, `Random`, `Weighted`, `LerpVector`. Prefer `Axiom.` in new code.
