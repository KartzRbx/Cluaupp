---
sidebar:
  order: 3
title: IntelliSense
---

CL++ highlighting, completion, and diagnostics come from **`clpp setup`** ([KartzRbx/CLPP](https://github.com/KartzRbx/CLPP) language pack).

**`.flare` schemas** use the Cluaupp Flare extension (highlighting, completions, hover, diagnostics, outline). `cluaupp intellisense` copies it into Cursor and VS Code.

```bash
clpp setup
cluaupp intellisense   # Flare extension + files.associations for .clpp / .flare
```

Reload the editor. Language ids: **`clpp`** for CL++, **`flare`** for `.flare`.

In a `.flare` file, start a line and accept `packet (from Client)`, `query`, or `opt name`. Types (`i32`, `Player`, `f64`, …) complete inside `(…)`. Hover a packet name to see the generated `Fire` / `Connect` / `Invoke` API. Unknown types squiggle; a quick-fix offers the closest match.

`cluaupp lsp` is the same Flare engine over stdio (other editors). It does not compile CL++ on keystroke — that stays with `clpp setup`.

Cluaupp needs **CL++ 0.8.0+**. Run `cluaupp language` to see which binary is selected.
