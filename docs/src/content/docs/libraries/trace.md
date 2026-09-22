---
title: Trace
---

**Trace** pretty-prints values for Studio. [Lens](../lens/) uses `Trace.display` inside windows. Circular tables and max depth are capped so dumps cannot infinite-loop.

Header: `#include <clpp/libs/trace.clh>`. Runtime: `CluauppLibs.Trace`.

## Why

- **Safe dumps.** Cycles render as `<circular>`; depth overflow as `{...}`. Instances, vectors, `CFrame`, `Color3`, `UDim2`, and `buffer` have dedicated formatting.
- **Not a network format.** Never send Trace output on [Flare](../flare/) or expose secrets (DataStore keys, session tokens) on live clients.

## Example

```clpp
#include <clpp/libs/trace.clh>

void init() {
	Trace.Dump(workspace);
	string text = Trace.Display(Vector3::one);
	Trace.builder().MaxDepth(4).Indent("  ").Print(stats);
}
```

## API

### `Trace.builder`

**Returns:** `TraceBuilder` — fluent `MaxDepth`, `Indent`, then `Display` / `Print`.

**When:** Repeated dumps with the same depth and indent (debug menus, NPC inspectors).

```clpp
TraceBuilder b = Trace.builder();
```

### `Trace.Display`

**Returns:** `string` — formatted value (PascalCase alias).

**When:** Show text in a label or return a string without printing.

```clpp
string s = Trace.Display(myTable);
```

### `Trace.display`

**Returns:** `string` — same as `Display`.

**When:** Match Lens / lowercase call style.

```clpp
string s = Trace.display(myTable);
```

### `Trace.Print`

**Returns:** nothing — prints via `print`.

**When:** Quick one-off in Studio.

```clpp
Trace.Print(player);
```

### `Trace.Dump`

**Returns:** nothing — alias of `Print`.

**When:** Same as `Print`; reads naturally in debug scripts.

```clpp
Trace.Dump(state);
```

### `TraceBuilder.MaxDepth`

**Returns:** `TraceBuilder` — `self` for chaining.

**When:** Shallow dumps for huge tables (default depth 4 in runtime).

```clpp
Trace.builder().MaxDepth(2);
```

### `TraceBuilder.Indent`

**Returns:** `TraceBuilder` — `self` for chaining.

**When:** Wider or narrower nesting (default two spaces).

```clpp
Trace.builder().Indent("\t");
```

### `TraceBuilder.Display`

**Returns:** `string` using the builder’s depth and indent.

**When:** Format once with custom settings without mutating globals.

```clpp
string s = Trace.builder().MaxDepth(6).Display(root);
```

### `TraceBuilder.display`

**Returns:** `string` — lowercase alias of builder `Display`.

**When:** Same as `TraceBuilder.Display`.

```clpp
string s = Trace.builder().display(root);
```

### `TraceBuilder.Print`

**Returns:** nothing.

**When:** Print with builder settings applied.

```clpp
Trace.builder().MaxDepth(3).Print(npc);
```

### `TraceBuilder.build`

**Returns:** `TraceBuilder` — `self` (no-op finisher for CL++ chain style).

**When:** Satisfy generated call chains that end in `.build()`.

```clpp
Trace.builder().MaxDepth(5).build().Print(x);
```
