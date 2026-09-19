---
title: Lens
---

**Lens** is a client debug UI: immediate-mode widgets inside `Window(title, draw)`. One Sweep per window — **no `End()`** — closing destroys scoped state. Server require is a no-op (callbacks still run; no GUI).

Header: `#include <clpp/libs/lens.clh>`. Runtime: `CluauppLibs.Lens`.

## Why

**Use when:**

- Local tuning panels (sliders, copy-to-clipboard, tables) during development.
- You want scoped teardown without manual instance cleanup.

**Do not use when:**

- Admin actions (give items, kick) — [Helm](/libraries/helm/) on the server.
- Production player-facing UI — use [Gleam](/libraries/gleam/).

## Example CL++

```clpp
#include <clpp/libs/lens.clh>

void DrawEconomy() {
	Lens.Text("Economy");
	Lens.Value("tax", 0.1);
	Lens.Slider("tax", 0.1, 0, 1);
	Lens.Button("copy", func () {
		Lens.Copy("debug snapshot");
	});
}

[[client]]
void init() {
	Lens.Init();
	Lens.Window("Economy", DrawEconomy);
}
```

## API

### Lens.Init

**Returns:** `void`.

**When:** Once on client before first `Window` (sets up Lens host).

### Lens.Window

**Returns:** `void` — opens a draggable, searchable panel; `draw` runs each frame while open.

**When:** Root of a debug menu. Nested layout uses `Tree`, not a separate window API.

```clpp
Lens.Window("Stats", func () { Lens.Text("hello"); });
```

### Lens.Text

**Returns:** `void`.

**When:** Static line in the current window.

### Lens.Button

**Returns:** `bool` — `true` if pressed this frame.

**When:** One-shot actions without a separate callback overload.

```clpp
if (Lens.Button("reload")) { /* ... */ }
```

### Lens.Button (onClick)

**Returns:** `bool` — press state; runs `onClick` when activated.

**When:** Prefer callback style in CL++.

### Lens.Checkbox

**Returns:** `bool` — current checked state.

**When:** Toggle with label; mutates internal state when clicked.

### Lens.Checkbox (value)

**Returns:** `bool` — starts from `value`.

**When:** Known initial toggle state.

### Lens.Slider

**Returns:** `double` — current value after interaction.

**When:** Two-argument form: `value` with max default or implicit range per runtime.

### Lens.Slider (value, max)

**Returns:** `double` — clamped between min implied `0` and `max`.

**When:** Normalized sliders (`0..max`).

### Lens.Slider (value, min, max)

**Returns:** `double`.

**When:** Full range control (e.g. tax `0..1`).

### Lens.Tree

**Returns:** `bool` — whether the tree node is open.

**When:** Collapsible section header without body callback.

### Lens.Tree (draw)

**Returns:** `bool` — open state; runs `draw` when expanded.

**When:** Nested debug controls.

### Lens.Table

**Returns:** `void`.

**When:** Empty table placeholder with title.

### Lens.Table (rows)

**Returns:** `void` — renders string grid.

**When:** CSV-like debug output.

### Lens.Plot

**Returns:** `void`.

**When:** Sparkline of numeric series.

### Lens.Search

**Returns:** `void` — filters visible widgets by query string.

**When:** Large panels; call at top of `draw`.

### Lens.Copy

**Returns:** `void` — copies string to clipboard (client).

**When:** Export repro steps or values from debug UI.

### Lens.Value

**Returns:** `void` — labeled readout.

**When:** Show string, number, or bool next to a label (overload per type).

```clpp
Lens.Value("coins", 12500);
```
