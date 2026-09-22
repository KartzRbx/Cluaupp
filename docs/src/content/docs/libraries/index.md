---
sidebar:
  order: 1
title: Using libraries
---

`#include <clpp/libs/keep.clh>` is IntelliSense. `cluaupp build` copies the Luau into `ReplicatedStorage.CluauppLibs`. You do not `require` by hand in CL++.

Each page below is written for a **game author**: what it is for, why it is faster or safer than rolling your own, a copy-paste example, and an **API** section that catalogs **every public function** with **Returns**, **When** to use it, and a small example (plus **Formula** only where the API is math).

**Naming:** library + API are PascalCase. Schema files stay lowercase (`.flare`, `.mint`, `.bloom`, `.helm`, `.shift`, `.hive`, `.axiom`).

**Wire vs state:** Flare/schema **packets** use compact buffer codecs on the network hot path — never JSON. That is **not** “every gameplay `struct` must be a buffer.” Game state stays idiomatic CL++; a future [Optimizer](../architecture/optimizer/) may lower hot layouts internally.

## Native names

| Native | You use it for | Strong at |
| --- | --- | --- |
| [Flare](flare/) | packets + queries | Zap-tight packing, no remotes by hand |
| [Sweep](sweep/) | cleanup | `~>` Connect cannot leak |
| [Spark](spark/) | in-process events | O(1) Disconnect, pooled runners |
| [Keep](keep/) | player save data | ProfileStore lock + duplication-proof trades |
| [Mint](mint/) | `12.5K` labels | `--!native` formatters |
| [Axiom](axiom/) | lerp / easing / math | `.axiom` ships only the groups you list |
| [Roster](roster/) | tables + pack | tagged Pack/Unpack, no JSON |
| [Gleam](gleam/) | HUD | Vide-style `{ .Field = }`, Coil springs |
| [Bloom](bloom/) | UI shine | one Heartbeat for every preset |
| [Lens](lens/) | Studio debug | `Window(title, fn)` — no `End()` |
| [Crest](crest/) | topbar | follows Roblox inset |
| [Pin](pin/) | world labels | distance fade + occlusion |
| [Stage](stage/) | shop 3D preview | ViewportFrame + WorldModel |
| [Coil](coil/) | springs | Fraktality, Hz, `--!native` |
| [Helm](helm/) | admin commands | typed args, server permission |
| [Shift](shift/) | AI / combat modes | compiled u8 state ids |
| [Hive](hive/) | many NPCs | ECS columns + snapshot buffers |
| [Ward](ward/) | anti-cheat | remote rate-limit, packet cap, speed strikes |
| [Ember](ember/) | VFX | Sweep lifetime, character Attach |
| [Echo](echo/) | other characters | 20 Hz CFrame snapshots |
| [Guide](guide/) | tutorial | Sweep per step |
| [Trace](trace/) | dumps | circular / depth guards |
| [Promise](promise/) | async | evaera, vendored |
| [Net](net/) | remotes without Flare | tagged buffers (prefer Flare) |
| [ArrayIndexer](arrayindexer/) | ECS ids | dense acquire / release |
| [Occlude](occlude/) | line of sight | camera → adornee raycast |

Libraries ship **inside npm `cluaupp`** (`runtime/` → `libs/` on init). There is no `@cluaupp/keep` on npm.

Copy-paste systems: [Examples](../examples/) — data boot (Keep), [connection](../examples/net/) (Flare), HUD (Gleam+Mint+Bloom), NPC (Shift+Hive).
