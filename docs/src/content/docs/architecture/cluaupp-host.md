---
title: Cluaupp host
description: How Cluaupp consumes the CL++ CompileArtifact — nativeHints, layoutHints, PGO, and product hooks.
sidebar:
  order: 9
---

# Cluaupp host

CL++ emits a JSON **CompileArtifact**. Cluaupp (this repo) must consume it — it does **not** re-parse the language. Upstream contract: [CL++ cluaupp-host](https://github.com/KartzRbx/CLPP/blob/main/docs/cluaupp-host.md) and `support/cluaupp.d.ts` / `support/cluaupp-bridge.ts` in KartzRbx/CLPP.

## Artifact fields (0.8+)

| Field | Host action |
| --- | --- |
| `nativeHints` | Selective `#pragma native` / `@native` via apply — **never** blanket |
| `layoutHints` | SoA / buffer decisions (`SoA:…`, `BufferSpecialize:…`, …) |
| `specialized` / `optimized` | Diagnostics / reporting |
| `sourceMap` | Map Luau lines back to CL++ ([source maps](../studio-tools/)) |
| `requires` | Path mapping → Rojo / DataModel `require` |

Platform helpers in CL++ (`capabilities_from_hints`) map prefixes into `NativeCandidate`, `BufferCandidate`, `SoaCandidate`, `ServerOnly`, `ClientOnly`.

## Commands

```bash
cluaupp optimize                 # advisor JSON from static signals
cluaupp optimize --apply         # insert selective native
cluaupp optimize --apply --layout   # SoA companion modules (opt-in)
cluaupp profile / profile --ingest  # PGO → hotFunctions ranking
cluaupp docs                     # .cluaupp/PROJECT.md
```

Philosophy and storage levels: [Optimizer](../optimizer/).

## Product surface (beyond the compiler)

| Capability | Owner |
| --- | --- |
| Watch / Rojo sync | Cluaupp |
| Typed remotes (Flare) | Cluaupp schemas + build |
| Typed DataModel queries | Cluaupp |
| Doctor / analyze / Context / Authority | Cluaupp (`CLUAU####`) |
| Language diagnostics | CL++ (`CLPP####`) |

Angle includes (`#include <clpp/…>`) are **host prelude**, not language modules. App deps use `import { … } from` — see [Modules](../../language/modules/).
