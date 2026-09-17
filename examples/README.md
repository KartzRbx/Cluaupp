# Sample game

CL++ sources for a Cluaupp project — **not** the compiler. Language samples: [CL++ examples](https://github.com/KartzRbx/CLPP/tree/main/examples).

| Folder | Rojo | Tag |
| --- | --- | --- |
| `src/server/*.server.clpp` | Script | server |
| `src/client/*.client.clpp` | LocalScript | client |
| `src/shared/*.clp` / `*.clh` | ModuleScript | none |

```bash
cd examples/game
npx cluaupp build .
```

`cluaupp init` copies `templates/game`. This folder adds combat (`guard` / `match` / `signal` / `observable` / `spawn`), a Fusion HUD, `features.clp`, and `PlayerData.clh`.
