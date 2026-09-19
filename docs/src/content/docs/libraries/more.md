---
title: More libraries
---

There are **no alias headers**. Use the [native name map](/libraries/) below. Each Cluaupp library page catalogs **every public function** with **Returns**, a short **When** recommendation, and a copy-paste example.

| If you used | Use now |
| --- | --- |
| formatnumber | [Mint](/libraries/mint/) |
| MathUtils | [Axiom](/libraries/axiom/) |
| table util | [Roster](/libraries/roster/) |
| Twinkle / EzVisualz | [Bloom](/libraries/bloom/) |
| Module3D | [Stage](/libraries/stage/) |
| vfx-util | [Ember](/libraries/ember/) |
| StickyBillboard | [Pin](/libraries/pin/) |
| Fusion / Vide | [Gleam](/libraries/gleam/) |
| Iris | [Lens](/libraries/lens/) |
| Cmdr | [Helm](/libraries/helm/) |
| TopbarPlus | [Crest](/libraries/crest/) |
| Chrono | [Echo](/libraries/echo/) |
| RobloxStateMachine | [Shift](/libraries/shift/) |
| spring | [Coil](/libraries/coil/) |
| Display | [Trace](/libraries/trace/) |
| TutorialKit | [Guide](/libraries/guide/) |
| QuickNet | [Flare](/libraries/flare/) |
| GoodSignal | [Spark](/libraries/spark/) |
| janitor | [Sweep](/libraries/sweep/) |
| ProfileStore / DataService | [Keep](/libraries/keep/) |
| ad-hoc remote rate limits | [Ward](/libraries/ward/) |

## When to pick each name

- **Mint** — HUD numbers (`12.5K`, grouped coins). Display only; never parse formatted strings back into economy.
- **Axiom** — Lerps, easing, and math helpers from a `.axiom` schema; ship only the groups you list.
- **Roster** — Table utilities plus tagged `Pack` / `Unpack` buffers (same spirit as Keep tags, plus arrays and Roblox types).
- **Bloom** — One Heartbeat-driven UI shine preset for many labels; not full reactive UI.
- **Stage** — `ViewportFrame` shop preview with a `WorldModel`; replaces Module3D-style showcases.
- **Ember** — Character-attached VFX with [Sweep](/libraries/sweep/) lifetime; replaces ad-hoc vfx-util spawning.
- **Pin** — World-space billboards with distance fade; pair with [Occlude](/libraries/occlude/) for line-of-sight.
- **Gleam** — Client HUD with `Source` / `Effect` and Sweep-owned UI trees; Vide-style props, not Fusion graphs.
- **Lens** — Studio debug windows (`Window(title, fn)`); uses Trace for in-window dumps.
- **Helm** — Server-permission admin commands with buffer-packed args; replaces Cmdr-style consoles.
- **Crest** — Topbar icons that respect Roblox screen inset; replaces TopbarPlus-only wiring.
- **Echo** — **20 Hz** unreliable **CFrame snapshots** for other players; not full character replication or physics authority.
- **Shift** — Compiled FSM/HSM with **u8** state ids and buffer `WriteId` / `ReadId`; AI/combat **modes**, not ECS.
- **Coil** — Springs on Heartbeat (`--!native`); use from Gleam `Spring` or any motion that needs Hz-based smoothing.
- **Trace** — Studio-safe pretty-print with depth and cycle guards; never a wire format.
- **Guide** — Multi-step tutorials with per-step Sweep; call `Guide.Start(steps)`, not `Start(player)`.
- **Flare** — First choice for game remotes and queries with tight buffer packing; prefer over hand-rolled remotes.
- **Spark** — In-process signals with O(1) disconnect and pooled runners; not cross-network.
- **Sweep** — Janitor-style cleanup for connections, instances, and tasks; default for `~>` Connect ownership.
- **Keep** — ProfileStore-class session lock, tagged replication, escrow trades that cannot duplicate on crash; all persisted player data.
- **Ward** — Server anti-cheat: rate-limit remotes, cap packet size, strike speed/teleport. Does not write Keep.

Helpers (also CluauppLibs, not npm packages): [ArrayIndexer](/libraries/arrayindexer/) (dense entity ids for ECS-style games), [Occlude](/libraries/occlude/) (raycast helper for [Pin](/libraries/pin/)).

Everything ships **inside the `cluaupp` npm package** (`runtime/` → `libs/` on init).
