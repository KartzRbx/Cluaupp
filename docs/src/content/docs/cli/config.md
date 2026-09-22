---
sidebar:
  order: 2
title: Configuration
---

File: `cluaupp.config.json` at the game root (next to `src/`).

```json
{
	"rootDir": "src",
	"outDir": "out",
	"strict": false,
	"architecture": false
}
```

| Field | Default | Effect |
| --- | --- | --- |
| `rootDir` | `"src"` | Where `.clpp` / `.clp` / `.clh` live |
| `outDir` | `"out"` | Where Luau is written |
| `strict` | `false` | Prefix `--!strict` when `clpp` did not already (overridden by `#pragma`) |
| `architecture` | `false` | Ignored in 1.0 (always one file in, one file out) |

## Rojo

The template maps:

- `out/ServerScriptService` → `ServerScriptService`
- `out/ReplicatedStorage/Shared` → `ReplicatedStorage.Shared`
- `out/StarterPlayer/StarterPlayerScripts` → `StarterPlayer.StarterPlayerScripts`
- `out/StarterPlayer/StarterCharacterScripts` → `StarterPlayer.StarterCharacterScripts`
- `out/ServerStorage` → `ServerStorage`
- `out/ReplicatedFirst` → `ReplicatedFirst`
- `libs` → `ReplicatedStorage.CluauppLibs`

`*.server.clpp` → `*.server.luau` (Script). `*.client.clpp` → LocalScript. `.clp` / `.clh` → ModuleScript.

## Luau style

Every `out/**/*.luau` is reindented on write: **tabs**, indent 4, Roblox/Luau. Nested `Connect` lambdas indent their body and `end`. Blank lines separate `if` / `for` / `while` scopes. Consecutive `Table.Field =` inits stay packed. `cluaupp init` / `cluaupp intellisense` writes `stylua.toml` with the same rules. `cluaupp build --format` also runs StyLua if it is on PATH.
