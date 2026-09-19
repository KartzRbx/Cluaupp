---
sidebar:
  order: 3
title: IntelliSense
---

CL++ highlighting, completion, and diagnostics come from **`clpp setup`** ([KartzRbx/CLPP](https://github.com/KartzRbx/CLPP) language pack). Cluaupp does not ship clangd or a C++ engine.

```bash
clpp setup
cluaupp intellisense   # writes files.associations for .clpp / .clp / .clh
```

Reload the editor. Language id is **`clpp`**, not `cpp`.

Do not run `cluaupp lsp` for day-to-day editing. It does not compile on keystroke. Completion and error lens come from the official CL++ pack (`clpp setup`). If both Cluaupp diagnostics and `source=clpp` appear, disable `kartzdev.cluaupp-diagnostics-*` and keep only CL++.

Cluaupp needs **CL++ 0.3.2+**. A cargo `clpp 0.1.0` earlier on PATH cannot parse `for (T x in list)`, `GetService<T>()`, or `#pragma strict`. Run `cluaupp language` to see which binary is selected.
