---
title: Parallel Luau & thread safety
description: Registry stores official ThreadSafety; CLUAU-PAR* diagnostics validate parallel regions.
sidebar:
  order: 4
---

# Parallel Luau & thread safety

Roblox documents Parallel Luau (Actors, `task.desynchronize` / `synchronize`, `ConnectParallel`) and per-member **ThreadSafety** in the API dump (`Unsafe`, `ReadSafe`, `LocalSafe`, `Safe`).

Cluaupp **consumes** that metadata into the Canonical Registry — it does not invent a parallel runtime.

## Shipped today

- `PropertyDefinition` / `MethodDefinition` / … include optional `threadSafety`
- Normalized from Mini/Studio dump `ThreadSafety` field (~**8.4k** members in the shipped dump)
- Exposed on `api/generated/lsp-index.json` for CL++ / tooling
- **`CLUAU-PAR*`** diagnostics on `parallel {}` / desync regions (`cluaupp target check-parallel`, doctor / analyze)
- Optimizer may **advise** parallelizable loops (`cluaupp optimize`)

```bash
cluaupp api inspect BasePart
# members include threadSafety where the dump provides it

cluaupp target check-parallel path/to/file.server.clpp
```

## Honest limits

- Diagnostics are **heuristic** (pattern / region based), not a full Luau Actor scheduler model
- Cluaupp does **not** auto-split work across Actors
- Instance mutations inside parallel regions still need a serial phase — the checker warns; it does not rewrite your loop

See [Product architecture](../product-pillars/) — Parallel Compiler remains a **true differentiator**, now with shipped ThreadSafety + PAR* checks.
