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

`*.server.cpp` becomes a folder with `init.luau` + `init.meta.json` (`className` Script, `RunContext` Server). `.client` stays LocalScript via `init.client.luau`. A `.legacy.server.cpp` dump is still `*.server.luau` (Legacy).
