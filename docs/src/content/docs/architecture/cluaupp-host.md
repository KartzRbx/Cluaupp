---
title: Cluaupp host
description: How Cluaupp consumes the CL++ CompileArtifact — imports, nativeHints, layoutHints, PGO.
sidebar:
  order: 9
---

# Cluaupp host

CL++ emits a JSON **CompileArtifact**. Cluaupp does **not** re-parse the language AST, but it **does** understand the CL++ 0.8 module surface for Rojo mapping, authority, and cache. Upstream: [CL++ cluaupp-host](https://github.com/KartzRbx/CLPP/blob/main/docs/cluaupp-host.md).

## Modules (`import` + legacy `#include`)

```clpp
import { Wallet } from "./PlayerData.clh";
import { PlayerData as Data } from "./PlayerData.clh";
```

| Step | What Cluaupp does |
| --- | --- |
| Parse | `import { } from` + quoted `#include` (`src/clpp/modules.ts`); angle `<clpp/…>` = prelude only |
| Resolve | Relative to the importing file / `src/` |
| Graph | `target graph` / AUTH004 edges include imports |
| Authority | `CLUAU_AUTH001` scans `import … from "…ServerScriptService…"` |
| Require rewrite | `script.Parent…Service…` → `require(Service.…)` + `GetService` |
| Rojo | `RojoMapper.resolveImportToRequire` (strips `.clh`/`.clpp`/`.clp`) |
| Cache | Incremental fingerprint hashes one-hop language deps |

See [Modules](../../language/modules/).

## Artifact fields (0.8+)

| Field | Host action |
| --- | --- |
| `requires` | Named import / quoted include edges from `clpp` |
| `nativeHints` | Selective `@native` in postprocess — **never** blanket |
| `layoutHints` | SoA / buffer candidates for `optimize --apply --layout` |
| `optimize` (request) | Passed to `clpp api compile` (default true) |
| `sourceMap` | File-level maps on build |

## Commands

```bash
cluaupp optimize --apply --layout
cluaupp target graph
cluaupp profile / profile --ingest
```

See [Optimizer](../optimizer/).
