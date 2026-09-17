# Sample game

This is the C++ a Cluaupp game looks like — **not** the compiler.

| Folder | Rojo | Tag |
| --- | --- | --- |
| `src/server/*.server.cpp` | Script | server |
| `src/client/*.client.cpp` | LocalScript | client |
| `src/shared/*` | ModuleScript | none |

`src/` of **this repo** is the TypeScript CLI ([roblox-ts](https://github.com/roblox-ts/roblox-ts) does the same). The sample scripts live here so they never mix with `understand.ts`.

```bash
cd examples/game
npx cluaupp build .
```

`cluaupp init` copies `templates/game` (the slim scaffold). This folder adds combat / HUD so `SystemUnderstander` has real tokens to score.
