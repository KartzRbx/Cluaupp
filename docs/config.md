# Configuration

File: `cluaupp.config.json` at the game root (next to `src/`).

```json
{
	"rootDir": "src",
	"outDir": "out",
	"strict": true,
	"architecture": true
}
```

| Field | Default | Effect |
| --- | --- | --- |
| `rootDir` | `"src"` | Where the `.cpp` / `.h` / `.hpp` files live |
| `outDir` | `"out"` | Where services and modules are written |
| `strict` | `true` | Prefix `--!strict` on every generated file |
| `architecture` | `true` | Emit PascalCase service folders (`LeaderStats/Main.luau`, …) instead of one dump per `.cpp` |

If the file is missing, those defaults apply.

## Rojo

The template ships `default.project.json` mapping:

- `out/server` → `ServerScriptService.Cluaupp`
- `out/client` → `StarterPlayer.StarterPlayerScripts.Cluaupp`
- `out/shared` → `ReplicatedStorage.Cluaupp`

`*.server.luau` and `*.client.luau` files are classified by Rojo as Script and LocalScript. A folder with `init.server.luau` becomes a Script named after the folder (`LeaderStats`) with ModuleScript children (`Main`, `PlayersManager`, `CacheController`, `LeaderStatsTypes`).
