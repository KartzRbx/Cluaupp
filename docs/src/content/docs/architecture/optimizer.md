---
title: Cluaupp Optimizer
description: Write idiomatic CL++; the compiler chooses tables, SoA, buffer, native, or parallel — buffer is a backend, not the programming model.
sidebar:
  order: 8
---

# Cluaupp Optimizer

**Philosophy (absolute):**

> The programmer writes normal code. Cluaupp chooses the fastest representation that preserves semantics.

Not:

> Transform everything into `buffer`.

Buffer is a **storage backend** for some workloads — not the mental model of the language.

## Why blind buffering loses

Roblox `buffer` is fixed-size binary storage: great for compact numeric payloads and some hot datasets. It is a poor universal object model:

- Fixed size + manual offsets
- May copy across Roblox APIs
- Not shared across Actors
- Fighting Luau where tables, field access, iteration, and **Vector3** already win

Luau already optimizes tables and vector types (including SIMD-friendly Vector3 paths). Automatically tearing a `Vector3` into bytes can be **slower**, not faster.

## What the programmer writes

```clpp
struct EnemyState {
	float Health = 100;
	float Speed = 16;
	Vector3 Position = Vector3(0, 0, 0);
	int TargetId = 0;
};

array<EnemyState> enemies;

for (EnemyState enemy in enemies) {
	enemy.Health -= damage;
}
```

They keep seeing **`EnemyState`**. They never maintain:

```luau
buffer.writef32(data, 0, ...)
buffer.writef32(data, 4, ...)
```

Generated `out/` is read-only; source maps point back to the CL++ line.

## Storage levels (internal)

| Level | Representation | Typical use |
| --- | --- | --- |
| **0 — Normal** | Luau tables / objects | UI, services, controllers, config, dynamic shapes |
| **1 — Dense arrays** | Optimized array / `table.create` patterns | Homogeneous numeric / POD arrays |
| **2 — Packed buffer** | `buffer` | Millions of scalars, wire payloads, large numeric blobs |
| **3 — Data-oriented** | SoA, batch loops, then parallel / native | NPC / particle / sim hot paths |

Specialization example (conceptual):

```text
struct Particle { Position, Velocity, Life, Active }
        ↓ analysis
Positions[]  Velocities[]  Life[]  Active bitset
```

Bit-packing of bool clusters (`IsAlive` / `IsFlying` / …) is allowed **internally**. Quantization (`f16` / `i16` positions) only under an **explicit** contract — never silent precision loss.

## Attack order (not “BUFFER!!!”)

1. Algorithm  
2. Call frequency  
3. Unnecessary work  
4. Allocations / GC  
5. Data layout  
6. Batching  
7. Parallel Luau  
8. Native codegen  
9. Buffer packing  
10. Micro-opts  

Roblox’s own guidance often points at per-frame waste, fat table serialize/clone, and work that could be parallel — layout is mid-stack, not the first knob.

## Pipeline (vision)

```text
CL++ → Typed Semantic IR → Cluaupp Optimizer
        ├── Data layout   (table / SoA / buffer)
        ├── Execution     (serial / parallel / native hints)
        └── Memory        (alloc, packing, lifetime)
                ↓
         Luau backend (readable or optimized)
```

Companion analyzers (same family as [Parallel safety](../parallel-safety/) and the Performance pillar):

| Analyzer | Question |
| --- | --- |
| Storage | Best layout for this type + access pattern? |
| Allocation / lifetime | Leak / churn? |
| Parallel | Independent + thread-safe APIs? |
| Native | Numeric-hot, low Instance API? |
| Profile-guided | `cluaupp profile` / `--ingest` — rank advice by playtest weights |

## Build modes (same semantics)

| Mode | Behavior |
| --- | --- |
| **`auto` (default)** | Decide per type / function from static signals |
| **`debug`** | Readable Luau; no aggressive lowering |
| **`optimized`** | Layout + alloc + batching + native *hints* |
| **`extreme`** | Aggressive SoA / packing / buffer / parallel / native |

Example auto decisions:

| Symbol | Signal | Choice |
| --- | --- | --- |
| `EnemyState` | Hot numeric fields | SoA |
| Network packet | Serialized often | buffer (Flare already packs wire) |
| `UIState` | Dynamic | table |
| `CalculatePhysics` | Numeric, low API | `@native` candidate |
| `NPCValidation` | Independent + Safe APIs | Parallel candidate |

## Flare buffers vs game-state buffers

**Do not confuse these:**

| Layer | Role |
| --- | --- |
| **Flare / schemas** | Wire contracts — compact codecs on the network hot path (no JSON) |
| **Storage Optimizer** | How *your* `struct` / `array` state is laid out in Luau |

Authoring Flare packets stays schema-driven. Authoring gameplay state stays idiomatic structs. Only the optimizer may lower state to buffer/SoA when profitable.

## Status

**Advisor v1 shipped** — `cluaupp optimize` emits storage / native / parallel suggestions.

**Apply v1** — `optimize --apply` inserts `#pragma native`. **`optimize --apply --layout`** adds `#pragma layout soa` and generates `.cluaupp/generated/soa/*Soa.luau` (optional `--buffer` for f32/i32 columns). It does **not** silently rewrite every gameplay struct.

**CL++ 0.8 artifact** — `nativeHints` / `layoutHints` from the compiler opt pipeline feed the same apply path. See [Cluaupp host](../cluaupp-host/).

**PGO format** — `cluaupp profile` writes `cluaupp.profile.json`; `optimize --profile` ranks advice; `profile --ingest` merges Studio JSONL.

Identity wedge still starts with [Typed DataModel](../typed-datamodel/) + Context / Parallel / Flare. This page locks the philosophy: never market “our libs use buffer” as the product.

Product story instead:

> Write idiomatic CL++; Cluaupp automatically lowers hot data and computation into the most appropriate Roblox representation.
