---
sidebar:
  order: 1
title: Using libraries
---

`#include <clpp/libs/keep.clh>` is IntelliSense. `cluaupp build` copies the Luau into `ReplicatedStorage.CluauppLibs`. You do not `require` by hand in CL++.

Each page below is written for a **game author**: what it is for, why it is faster or safer than rolling your own, a copy-paste example, and an **API** section that catalogs **every public function** with **Returns**, **When** to use it, and a small example (plus **Formula** only where the API is math).

**Naming:** library + API are PascalCase. Schema files stay lowercase (`.flare`, `.mint`, `.bloom`, `.helm`, `.shift`, `.hive`, `.axiom`). Hot path is **buffers** (u8 ids, ColorSequence, tagged tables) — never JSON.

## Native names

| Native | You use it for | Strong at |
| --- | --- | --- |
| [Flare](/libraries/flare/) | packets + queries | Zap-tight packing, no remotes by hand |
| [Sweep](/libraries/sweep/) | cleanup | `~>` Connect cannot leak |
| [Spark](/libraries/spark/) | in-process events | O(1) Disconnect, pooled runners |
| [Keep](/libraries/keep/) | player save data | ProfileStore lock + duplication-proof trades |
| [Mint](/libraries/mint/) | `12.5K` labels | `--!native` formatters |
| [Axiom](/libraries/axiom/) | lerp / easing / math | `.axiom` ships only the groups you list |
| [Roster](/libraries/roster/) | tables + pack | tagged Pack/Unpack, no JSON |
| [Gleam](/libraries/gleam/) | HUD | Vide-style `{ .Field = }`, Coil springs |
| [Bloom](/libraries/bloom/) | UI shine | one Heartbeat for every preset |
| [Lens](/libraries/lens/) | Studio debug | `Window(title, fn)` — no `End()` |
| [Crest](/libraries/crest/) | topbar | follows Roblox inset |
| [Pin](/libraries/pin/) | world labels | distance fade + occlusion |
| [Stage](/libraries/stage/) | shop 3D preview | ViewportFrame + WorldModel |
| [Coil](/libraries/coil/) | springs | Fraktality, Hz, `--!native` |
| [Helm](/libraries/helm/) | admin commands | typed args, server permission |
| [Shift](/libraries/shift/) | AI / combat modes | compiled u8 state ids |
| [Hive](/libraries/hive/) | many NPCs | ECS columns + snapshot buffers |
| [Ward](/libraries/ward/) | anti-cheat | remote rate-limit, packet cap, speed strikes |
| [Ember](/libraries/ember/) | VFX | Sweep lifetime, character Attach |
| [Echo](/libraries/echo/) | other characters | 20 Hz CFrame snapshots |
| [Guide](/libraries/guide/) | tutorial | Sweep per step |
| [Trace](/libraries/trace/) | dumps | circular / depth guards |
| [Promise](/libraries/promise/) | async | evaera, vendored |
| [Net](/libraries/net/) | remotes without Flare | tagged buffers (prefer Flare) |
| [ArrayIndexer](/libraries/arrayindexer/) | ECS ids | dense acquire / release |
| [Occlude](/libraries/occlude/) | line of sight | camera → adornee raycast |

Libraries ship **inside npm `cluaupp`** (`runtime/` → `libs/` on init). There is no `@cluaupp/keep` on npm.

Copy-paste systems: [Examples](/examples/) — HUD (Gleam+Mint+Bloom), NPC (Shift+Hive), data boot (Keep).
