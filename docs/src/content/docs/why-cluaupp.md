---
title: Why Cluaupp
description: What Cluaupp does that roblox-ts and plain Luau toolchains do not — platform-aware compilation.
sidebar:
  order: 2
---

# Why Cluaupp

**roblox-ts** is excellent at bringing TypeScript and its ecosystem to Roblox. Cluaupp does not try to beat that.

Cluaupp’s bet:

> Turn **architecture, security, and performance rules of Roblox** into **compile-time properties of the project** — then emit idiomatic Luau.

```text
roblox-ts  →  TypeScript  →  Luau
Cluaupp    →  CL++ + project semantics  →  validated Roblox project  →  Luau
```

## Advantages the competition does not own

### 1. Context Safety (shipped)

File tags (`.server` / `.client` / `.plugin`) attach a **capability set**. Illegal combinations fail the build — not a Studio playtest:

| Rule | Result |
| --- | --- |
| `LocalPlayer` in `*.server.clpp` | **error** |
| `DataStoreService` in `*.client.clpp` | **error** |
| `FireServer` on the server / `FireAllClients` on the client | **error** |

Profile: `api/generated/capability-profile.json`. See [Context Safety](../architecture/context-safety/).

### 2. Typed DataModel (shipped)

Rojo `default.project.json` → instance graph → `WaitForChild` / `FindFirstChild` validation (`CLUAU_DM_MISSING_CHILD`), including **variable-root** chains. See [Typed DataModel](../architecture/typed-datamodel/).

### 3. API Registry with ThreadSafety + Parallel checks

The Canonical Registry is built from the official Roblox dump:

- **925** classes · **636** enums · **~8.4k** members with **ThreadSafety**
- Parallel regions flagged with `CLUAU-PAR*` (`cluaupp target check-parallel` / doctor)

See [Parallel safety](../architecture/parallel-safety/) and [Benchmarks](../benchmarks/).

### 4. Authority + call-graph (shipped)

Import / service rules (`CLUAU-AUTH*`) plus **transitive** Client→Server reaches (`CLUAU_AUTH004`). `cluaupp check-authority` / doctor / `--frozen`.

### 5. Networking contracts (Flare)

One `.flare` schema → typed stubs, binary codecs, Ward inbound gate, **version** conflicts under `--frozen`. See [Flare](../libraries/flare/).

### 6. Optimizer (advisor + opt-in apply)

Not “everything → buffer.” Buffer is a **backend**. Gameplay stays idiomatic structs.

- `cluaupp optimize` — storage / native / parallel advice  
- `optimize --apply` — `#pragma native` → emit `--!native`  
- `optimize --apply --layout` — `#pragma layout soa` + generated `*Soa.luau` (optional `--buffer`)  
- PGO: `cluaupp profile` / `profile --ingest`

See [Cluaupp Optimizer](../architecture/optimizer/).

### 7. Studio tools + IDE bridge

Source stamps + maps, [CluauppNav](../architecture/studio-tools/) debug panel, `cluaupp bridge` ↔ Cursor/VS Code.

### 8. Reuse-first (honest scope)

| Cluaupp does | Cluaupp does **not** |
| --- | --- |
| Project host + registry + policies | Own Roblox LSP / Creator Docs mirror |
| Feed metadata into `clpp` | Extend the CL++ AST |
| Orchestrate Rojo + dumps | Replace Rojo or Studio |

## Status board

Full board: [Roadmap](../roadmap/). Architecture: [Product pillars](../architecture/product-pillars/).

Identity set is **shipped in code**: Typed DataModel · Parallel diagnostics · Flare contracts · Authority call-graph · Optimizer apply (opt-in) · source maps / doctor / bridge.

## Who should use Cluaupp

| You want… | Use |
| --- | --- |
| TypeScript + npm ecosystem on Roblox | [roblox-ts](https://roblox-ts.com/) |
| CL++ with **platform validation** before play | **Cluaupp** + [CL++](https://kartzrbx.github.io/CLPP/) |
| Plain Luau + Rojo only | Rojo + Studio |

## One-liner

> Write idiomatic CL++; Cluaupp validates the Roblox project and advises the fastest safe representation — it does not make you program in buffers.
