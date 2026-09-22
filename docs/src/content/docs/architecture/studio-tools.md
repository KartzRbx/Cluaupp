---
title: Studio tools
description: CluauppNav plugin, source stamps, error→CL++ remap, and the IDE HTTP bridge.
sidebar:
  order: 12
---

# Studio tools

Cluaupp does **not** ship a custom Roblox bytecode debugger. It ships **source-level** navigation and IDE sync on top of stamps + maps.

## What you get

| Piece | Role |
| --- | --- |
| `-- cluaupp-source: path/to/file.clpp` | Stamp on every emitted Luau |
| `out/**/*.luau.map.json` | File-level source map |
| `plugins/CluauppNav` | Studio toolbar + debug dock |
| `cluaupp bridge` | HTTP `:3847` Studio → IDE |
| Cursor / VS Code extension | Polls bridge and opens `.clpp` |

## Install CluauppNav

1. Copy `plugins/CluauppNav/` into your Roblox Plugins folder.
2. **Game Settings → Security → Allow HTTP Requests** (for the bridge).
3. Rebuild so Luau has the `cluaupp-source` stamp.
4. In the game root: `cluaupp bridge`.

## Toolbar

| Button | Action |
| --- | --- |
| **Source** | Show / print CL++ path for the selected Script |
| **Open IDE** | POST path to `cluaupp bridge` → editor opens the file |
| **Debug** | Dock: selection path + `ScriptContext.Error` remapped to CL++ |

## IDE side

With a Cluaupp game open (`default.project.json` present), the editor extension auto-polls `http://127.0.0.1:3847`. Commands:

- **Cluaupp: Start Studio Bridge Poll**
- **Cluaupp: Open Path from Bridge Event**

Settings: `cluaupp.bridgeUrl`, `cluaupp.bridgePollMs`.

## PGO from playtests

Use `plugins/CluauppNav/ProfileLogger.luau` during profiling, dump JSONL, then:

```bash
cluaupp profile --ingest ./playtest.jsonl
cluaupp optimize --profile
```

## Related

[Optimizer](../optimizer/) · [CLI commands](../../cli/commands/) · [Roadmap](../../roadmap/)
