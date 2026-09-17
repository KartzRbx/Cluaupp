# Configuration

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
| `rootDir` | `"src"` | Where the `.cpp` / `.h` / `.hpp` files live |
| `outDir` | `"out"` | Where Luau is written |
| `strict` | `false` | Prefix `--!strict` on generated files (overridden by `#pragma strict` / `#pragma nstrict`) |
| `architecture` | `false` | If `true`, emit PascalCase service folders (`LeaderStats/Main.luau`, …) instead of one Luau per `.cpp` |

If the file is missing, those defaults apply.

## Rojo

The template ships `default.project.json` mapping:

- `out/server` → `ServerScriptService.Cluaupp`
- `out/client` → `StarterPlayer.StarterPlayerScripts.Cluaupp`
- `out/shared` → `ReplicatedStorage.Cluaupp`

`*.server.cpp` becomes `*.server.luau` (Script). `*.client.cpp` becomes `*.client.luau` (LocalScript). Untagged files become ModuleScripts.
