---
title: Typed DataModel
description: Rojo project graph → compile-time path validation and generated datamodel.clh.
sidebar:
  order: 3
---

# Typed DataModel (v1 — shipped)

Cluaupp reads `default.project.json`, walks `$className` / `$path` nodes, and scans filesystem trees under `$path` to build an instance graph.

## What it does

1. **`cluaupp target datamodel [folder]`** — writes:
   - `.cluaupp/datamodel-profile.json`
   - `include/clpp/generated/datamodel.clh` (nested structs for IntelliSense)
2. **`cluaupp target check-datamodel <file>`** — validates `GetService<…>().WaitForChild(…).FindFirstChild(…)` chains
3. **`cluaupp build`** — same check before `clpp` (errors with `CLUAU_DM_MISSING_CHILD`)
4. **Variable-root chains** — `auto assets = …WaitForChild("Assets"); assets.WaitForChild("UI")` is tracked
5. **Component contracts** — optional `cluaupp.config.json` `components` (doctor / `--frozen`)

## Example

Rojo declares `ReplicatedStorage.Assets.UI.Main.PlayButton : TextButton`.

```clpp
auto btn = GetService<ReplicatedStorage>()
	.WaitForChild("Assets")
	.WaitForChild("UI")
	.WaitForChild("Main")
	.WaitForChild("FakeButton"); // build error CLUAU_DM_MISSING_CHILD
```

Variable root:

```clpp
auto assets = GetService<ReplicatedStorage>().WaitForChild("Assets");
auto btn = assets.WaitForChild("UI").WaitForChild("Main").WaitForChild("PlayButton");
```

## Limits (honest)

- Heuristic scan, not a full CL++ AST
- Dotted path **types** inside CL++ itself (beyond the generated header) still deepen in the language
- Runtime still uses Roblox APIs; the header is IntelliSense / documentation aid

## Related

[Product architecture](../product-pillars/) · [Roadmap](../../roadmap/) · [Context Safety](../context-safety/)
