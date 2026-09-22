---
title: Comparison
description: Cluaupp vs roblox-ts vs plain Luau — different jobs, different strengths.
sidebar:
  order: 4
---

# Comparison

## vs roblox-ts

[roblox-ts](https://roblox-ts.com/) is the mature **TypeScript → Luau** stack (types, Rojo, IntelliSense, transformers, ecosystem).

| | roblox-ts | Cluaupp |
| --- | --- | --- |
| Language | TypeScript | [CL++](https://kartzrbx.github.io/CLPP/) |
| Job | Bring TS ecosystem to Roblox | **Validate a Roblox project**, then emit Luau |
| Compile-time server/client rules | Convention / lint | **Context Safety** (build fails) |
| Typed Rojo DataModel paths | Manual | **Typed DataModel** + variable roots |
| API ThreadSafety in toolchain | Via community types | **First-class** + `CLUAU-PAR*` |
| Authority / call-graph | Convention | **`CLUAU-AUTH*` / `AUTH004`** |
| Remotes | Libraries / patterns | **Flare** contracts + Ward + versions |
| Optimizer / SoA | Hand-written | Advisor + opt-in `--layout` |
| Studio ↔ IDE | — | CluauppNav + `cluaupp bridge` |
| Compete on npm/TS plugins | Yes | No — different bet |

Cluaupp does **not** try to replace roblox-ts for TypeScript teams. It exists for CL++ teams that want **platform semantics** (authority, remotes, Parallel Luau metadata, DataModel) as compiler concerns.

Details: [Why Cluaupp](../why-cluaupp/) · [Architecture](../architecture/product-pillars/) · [Benchmarks](../benchmarks/).

## vs plain Luau + Rojo

| | Luau + Rojo | Cluaupp |
| --- | --- | --- |
| Write | Luau | CL++ → Luau |
| Catch `LocalPlayer` on server | Runtime / review | **Compile** |
| Catch missing `WaitForChild` path | Runtime | **Typed DataModel** |
| Typed remote schemas | Manual | **Flare** |
| Engine header / registry | Studio / types | **Generated + locked** |
| Doctor / frozen CI | Custom | `analyze` / `build --frozen` |

## vs C++ → WASM

Cluaupp never compiles native C++ or WASM. `clpp` (Rust) emits Luau. This package is the Roblox **project host**: init, Rojo, CluauppLibs, registry, Context Safety.

## When to use what

| Goal | Tool |
| --- | --- |
| Game in TypeScript | [roblox-ts](https://roblox-ts.com/) |
| Game in CL++ with platform validation | **Cluaupp** + [`clpp`](https://github.com/KartzRbx/CLPP) |
| Language reference | [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/) |
| Numbers | [Benchmarks](../benchmarks/) |
