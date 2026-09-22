---
title: Roadmap
description: Shipped vs next vs later — honest status for the Roblox semantic platform.
sidebar:
  order: 6
---

# Roadmap

**North star:** *Cluaupp understands your Roblox project and verifies architecture before play.*

## Versions

| Piece | Current |
| --- | --- |
| Cluaupp npm | **1.5.x** |
| Required `clpp` | **0.8.0+** (docs); host accepts **0.7.0+** until you upgrade |
| Target profile schema | **2** |

## Shipped in code (not docs-only)

| Layer | CLI / behavior |
| --- | --- |
| API Registry + lock + diff | `api generate` / `verify` / `diff` |
| Context Safety v1 | build + `target check-context` |
| Typed DataModel v1 | `target datamodel` / `check-datamodel` + build |
| Parallel ThreadSafety v1 | `CLUAU-PAR*` on `parallel {}` / desync — `target check-parallel` |
| Authority / architecture rules | `CLUAU-AUTH*` + `cluaupp.config.json` `rules` + call-graph `CLUAU_AUTH004` |
| Component contracts | `cluaupp.config.json` `components` + doctor / `--frozen` |
| Optimizer **advisor** + apply | `optimize --apply` native; `--layout` SoA modules (optional `--buffer`) |
| PGO profile + Studio ingest | `cluaupp profile` / `profile --ingest` + ProfileLogger stub |
| Project docs generator | `cluaupp docs` → `.cluaupp/PROJECT.md` |
| Security static scan | `cluaupp security` |
| Lifetime heuristics | doctor / analyze (`CLUAU-LIFE*`) |
| Project graph + cycles | `target graph` |
| Flare version conflicts | doctor / `--frozen` (`version N;` in `.flare`) |
| Source maps (file-level) | `out/**/*.luau.map.json` + `-- cluaupp-source:` stamp |
| Studio debug + nav | `plugins/CluauppNav` panel, error→CL++, Open IDE |
| Studio↔IDE bridge | `cluaupp bridge` + VS Code/Cursor poll |
| Hermetic build | `cluaupp build --frozen` |
| Incremental + parallel compile | `.cluaupp/compile-cache`; `--no-incremental`, `-j/--jobs` on `build` |
| Full doctor | `cluaupp target doctor` / `cluaupp analyze` |
| Wally thin wrap | `cluaupp add <pkg>` |
| CL++ 0.8 language surface (docs) | `import { } from`, Option/Result/`?`, exhaustive match, host hints |

## Still later / out of scope

| Item | Why |
| --- | --- |
| Silent SoA rewrite of all gameplay structs | Opt-in `#pragma layout soa` + generated `*Soa.luau` only; CL++ may emit layout **hints** |
| Intent contracts / effects / typestate / newtype / move | Reserved in CL++ RFCs 0014–0018 — not language API yet |
| Roblox bytecode / custom VM debugger | CluauppNav debug panel + error→CL++ + IDE bridge |

## Buffer law

Flare **wire** codecs use buffers. Gameplay state stays idiomatic structs; Optimizer may *advise* SoA/buffer — it does not force hand-written `buffer.writef32`.

## One-liner

> Write idiomatic CL++; Cluaupp validates the Roblox project and advises the fastest safe representation — it does not make you program in buffers.
