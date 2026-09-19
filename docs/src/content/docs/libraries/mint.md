---
title: Mint
---

**Mint** formats numbers for UI labels (`12500` → `12,500` or `12.5K`). `.mint` schemas codegen `--!native` helpers into `out/`; the runtime kernel matches the same rules.

Header: `#include <clpp/libs/mint.clh>`. Runtime: `CluauppLibs.Mint`.

**Display only.** Never treat formatted strings as coins in a DataStore or server economy. The only reverse path is **`Mint.From`**, which parses display text (Group / Compact / Scientific / Percent) — not authoritative save data.

## Why

**Use when:**

- Gleam labels, Crest counters, or shop UI need compact or grouped numbers.
- You want custom suffix thresholds (`{ {1000, "K"}, {1000000, "M"} }`) without pulling ICU.

**Do not use when:**

- You need locale-aware currency from Roblox — Mint is fixed English-style grouping.
- You need to recover exact economy values from arbitrary player-typed strings for purchases — validate numbers on the server, not `Mint.From` alone.

## Example CL++

```clpp
#include <clpp/libs/mint.clh>
#include <clpp/libs/gleam.clh>

[[client]]
void init() {
	GleamSource gold = Gleam.Source(12500);
	TextLabel label = Gleam.TextLabel();
	Gleam.Effect(func () {
		label.Text = Mint.Compact(gold.Get()); // display only
	});
}
```

## API

### Mint.Group

**Returns:** `string` — comma-grouped decimal (specials: `NaN`, `±∞`).

**When:** Full numbers in inventory or stats where compact suffixes would hide precision.

```clpp
post(Mint.Group(12500, 0)); // "12,500"
post(Mint.Group(3.14159, 2)); // "3.14"
```

### Mint.Group (fraction)

**Returns:** `string`.

**When:** Same as `Group` with explicit fractional digits (default `0` in the one-argument overload).

### Mint.Comma

**Returns:** `string` — alias of `Group(value, 0)`.

**When:** Integer-style grouping without passing `0` for fraction.

```clpp
post(Mint.Comma(1000000)); // "1,000,000"
```

### Mint.Compact

**Returns:** `string` — scaled value + suffix when above a threshold.

**When:** HUD currency, DPS, large counters.

```clpp
post(Mint.Compact(12500)); // "12.5K" (default fraction 1)
post(Mint.Compact(12500, 2)); // two decimal places before suffix
```

**Formula:** Let `n = |value|`. Pick the largest suffix pair `{ threshold, label }` with `n >= threshold`. Output `sign · floor(n/threshold · 10^fraction)/10^fraction · label`, or plain grouped number if none match. Default labels (threshold `10^(3i)`): `K M B T Qa Qi Sx Sp Oc No Dc Ud Dd Td Qad Qid Sxd Spd Ocd Nod Vg Uvg Dvg Tvg Qavg Qivg Sxvg Spvg Ocvg Novg`.

### Mint.Compact (digits)

**Returns:** `string`.

**When:** Shorthand for `{ Fraction = digits }` in runtime (header second parameter is `int digits`).

### Mint.Abbreviate

**Returns:** `string` — compact with default one fractional digit.

**When:** Same as `Compact` with a readable name in hand-written CL++.

```clpp
post(Mint.Abbreviate(1500000, 1)); // "1.5M"
```

### Mint.Abbreviate (digits)

**Returns:** `string`.

**When:** Explicit digit count for abbreviated form.

### Mint.Percent

**Returns:** `string` with `%` suffix.

**When:** Progress bars, tax rate labels (`0.25` → `25%`).

```clpp
post(Mint.Percent(0.25, 0)); // "25%"
```

**Formula:** `trimFraction(value × 100, fraction) .. "%"`.

### Mint.Percent (fraction)

**Returns:** `string`.

**When:** Control decimal places on the percentage.

### Mint.Scientific

**Returns:** `string` in `mantissa e±exp` form.

**When:** Debug readouts or extreme magnitudes where compact suffixes are not enough.

```clpp
post(Mint.Scientific(12345, 2)); // "1.23e+4"
```

**Formula:** `exp = floor(log10(n))`, `mantissa = n / 10^exp`, normalized so `mantissa < 10`.

### Mint.Scientific (fraction)

**Returns:** `string`.

**When:** Mantissa precision control.

### Mint.Format

**Returns:** `string` — same as `Group` (runtime alias).

**When:** Schema or code that expects a generic “format number” name.

### Mint.To

**Returns:** `string` — grouped display (runtime: `Group` with optional fraction).

**When:** Readable alias in UI code.

```clpp
post(Mint.To(9999, 0)); // "9,999"
```

### Mint.To (fraction)

**Returns:** `string`.

**When:** Grouped number with fractional digits.

### Mint.From

**Returns:** `double` — parsed number, or NaN on failure.

**When:** Reading back **display** text the player sees (e.g. a debug field), not loading saves. Optional custom suffix list matches `Compact`.

```clpp
double n = Mint.From("12.5K"); // 12500 — display reverse only
```

**Formula:** Strip `%` (divide by 100 if present), remove commas, parse mantissa, multiply by suffix factor from `Suffixes` list; scientific `e` notation supported.

### Mint.From (suffixes)

**Returns:** `double`.

**When:** Custom suffix labels must match those used in `Compact`.

### Mint.Suffixes

**Returns:** `LuaArray<auto>` — list of `{ 10^(3·i), labels[i] }` pairs.

**When:** Building a custom suffix table for `From` or codegen `Suffixes = …`.

```clpp
LuaArray<auto> sfx = Mint.Suffixes({ "K", "M" });
// { {1000,"K"}, {1000000,"M"} }
```

**Formula:** Pair `i` is `{ 10^(i×3), labels[i] }`.
