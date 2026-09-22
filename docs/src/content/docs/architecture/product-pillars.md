---
title: Product architecture
description: Cluaupp is a semantic Roblox project compiler — not another TypeScript→Luau toolchain.
sidebar:
  order: 1
---

# CLUAUPP — product architecture

Cluaupp is the **Roblox project host** for CL++. It is not “another TypeScript → Luau toolchain with more syntax.”

**roblox-ts** already wins on: auto setup, generated Roblox types, Rojo, IntelliSense, watch, transformers, ecosystem size.

**Cluaupp’s space:** a toolchain that understands Roblox **rules and limits** and turns architecture, safety, and performance into **verifiable project properties**.

```text
roblox-ts  →  TypeScript  →  Luau
Cluaupp    →  CL++ + project semantics  →  validated Roblox project  →  Luau
```

## Split (hard rule)

| Layer | Owns |
| --- | --- |
| **CL++** | Language + compiler: Pest, binder, `TypeId`, checker, Luau emit, source maps, thin platform hooks |
| **Cluaupp** | Project model, Rojo/DataModel graph, context/capability/thread-safety policies, remote wiring, API dump refresh, doctor, build graph |
| **Ecosystem** | Rojo, Studio, luau-lsp on **emitted** Luau, Roblox API dump |

Cluaupp **never** extends the CL++ AST. It calls `clpp api` / `clpp lsp` and feeds platform metadata into the session.

**Do not reinvent:** own LSP, manual API lists, own Rojo, own debugger, own optimizer. Orchestrate Roblox + Rojo + dump + CL++.

```text
                     CLUAUPP
                        │
                 Semantic Layer
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
    Roblox API        Rojo           Luau/LSP
       │                │                │
       ▼                ▼                ▼
  Thread Safety     DataModel       Tooling
       │                │                │
       └────────────────┼────────────────┘
                        ▼
                CL++ Semantic Model
                        │
                ┌───────┴───────┐
                ▼               ▼
          Diagnostics        Codegen
                        │
                        ▼
                       Luau
```

## Five true differentiators

### 1. Roblox Semantic Compiler

Understands API + DataModel + Instances + Contexts + Security + **Thread Safety** + Actors — not just names and signatures.

Registry members carry `type` **and** `threadSafety` (`Unsafe` / `ReadSafe` / `LocalSafe` / `Safe`) from the official dump.

### 2. Authority Compiler

Client / Server / Network / DataStore / mutation / capabilities. Call-graph reachability into server-only APIs becomes compile errors (`CLUAU####` for project rules; `CLPP####` for language).

**Status:** [Context Safety v1](../context-safety/) (file tags + capability profile). Deepen: import boundaries, `@serverOnly` reachability.

### 3. Parallel Compiler (elevate)

Official Parallel Luau model: Actor, `task.desynchronize` / `synchronize`, `ConnectParallel`, API thread-safety levels.

```text
@parallel ValidateRaycast
    → Workspace:Raycast     ReadSafe
    → part.Position         ReadSafe
    → part.Parent = ...     Unsafe  → CLUAU-PAR001
```

Optional later: suggest parallelizable loops / Actor splits — **advise**, don’t promise magic auto-parallel of everything.

### 4. Project / DataModel Compiler

```text
default.project.json → Rojo graph → Project Model → path typing + component contracts
```

**Status:** [Typed DataModel v1](../typed-datamodel/) shipped — graph + `WaitForChild`/`FindFirstChild` chain check (`CLUAU_DM_MISSING_CHILD`) + variable-root chains + `datamodel.clh` + component contracts. Remaining deepen: richer dotted path types inside CL++ itself.

### 5. Performance Compiler → **Cluaupp Optimizer**

**Rule:** write idiomatic CL++; the compiler chooses representation. Buffer is a **backend**, not the programming model.

Full design: [Cluaupp Optimizer](../optimizer/) — storage levels (table → dense → buffer → SoA), auto/debug/optimized/extreme modes, native + parallel as stages in the same pipeline, never silent quantization.

**Shipped:** advisor + `#pragma native` apply + `--!native` emit stamp + PGO format/ingest + **opt-in** `#pragma layout soa` / `*Soa.luau` (`optimize --apply --layout`, optional `--buffer`). **Not** silent rewrite of every gameplay struct.

Attack order: algorithm → frequency → waste → alloc → **layout** → batch → parallel → native → buffer packing → micro-opts.

Do **not** sell “everything is buffer.” Sell automatic lowering of hot data/compute while `out/` stays generated and source-mapped.

## Identity set (do not dilute)

Ship identity around this set — not 30 features:

| Priority | Feature | Notes |
| --- | --- | --- |
| 1 | **Typed DataModel** | Rojo → path check + header — **v1 shipped** |
| 2 | **Parallel + Thread Safety** | Registry `threadSafety` + `CLUAU-PAR*` |
| 3 | **Remote Contracts** | Grow **Flare** (+ version conflicts) |
| 4 | **Authority Analysis** | Context + import rules + **call-graph** `CLUAU_AUTH004` |
| — | Source maps + `doctor` + API diff + CluauppNav + bridge | Always-on platform hygiene |

Supporting (not the wedge alone): Instance `component` contracts, auto-parallel *suggestions*, **Cluaupp Optimizer** (advisor + native + opt-in SoA), project graph CLI, PGO ingest.

## Killer combo (ship order)

1. **Typed DataModel** — **shipped** ([doc](../typed-datamodel/))  
2. **Thread Safety in registry** — **shipped**  
3. **Context / Authority** — v1 + call-graph — **shipped**  
4. **Remote Contracts** — Flare — **shipped**  
5. **Parallel diagnostics** (`CLUAU-PAR*`) — **shipped** heuristics  
6. **Source-level debugging** — maps + stamp + CluauppNav + bridge — **shipped**  
7. **Cluaupp Optimizer** — advisor + native + opt-in SoA — **shipped**; silent full-game SoA later

## What CL++ must expose (hooks only)

- `Session::with_roblox_platform()`, prelude / `.clh`, `GetService<T>`, emit + source maps  
- Compile payload: `targetProfilePath`, `runContext`, `capabilityProfilePath`  
- Later RFCs only if needed: `@server` / `@parallel` / `remote` / `component`

## Philosophy one-liner

> Cluaupp turns CL++ into a **semantically validated Roblox project**, then emits idiomatic Luau — zero unnecessary runtime layer. It does not create a new Roblox; it is the first compiler that understands Roblox well enough to block architectural mistakes **before** play. Long-term: write normal code; the [Optimizer](../optimizer/) lowers hot paths — it does not force a buffer programming model.
