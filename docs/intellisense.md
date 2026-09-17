# IntelliSense

CL++ highlighting, completion, and diagnostics come from **`clpp install`** ([KartzRbx/CLPP](https://github.com/KartzRbx/CLPP) language pack). Cluaupp does not ship clangd or a C++ engine.

```bash
clpp install
cluaupp intellisense   # writes files.associations for .clpp / .clp / .clh
```

Reload the editor. Language id is **`clpp`**, not `cpp`.

`cluaupp lsp` can surface `clpp` compile errors over stdio; prefer the official CL++ extension for day-to-day editing.
