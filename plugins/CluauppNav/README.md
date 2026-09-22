# Cluaupp Studio tools (Nav + Debug + IDE bridge)

## Install

1. Copy this folder to your Roblox Plugins directory.
2. In Studio: **Game Settings → Security → Allow HTTP Requests** (for IDE bridge).
3. In the game root: `cluaupp bridge` (listens on `127.0.0.1:3847`).
4. Rebuild so Luau has `-- cluaupp-source: …`.

## Toolbar

| Button | Action |
| --- | --- |
| **Source** | Print / show CL++ path for selected Script |
| **Open IDE** | POST path to `cluaupp bridge` → Cursor/VS Code opens the file |
| **Debug** | Dock panel: selection path + runtime errors remapped to CL++ |

## PGO

Use `ProfileLogger.luau` during playtests, then `cluaupp profile --ingest hits.jsonl`.

## SoA

`cluaupp optimize --apply --layout` writes `#pragma layout soa` and emits `.cluaupp/generated/soa/*Soa.luau`.
