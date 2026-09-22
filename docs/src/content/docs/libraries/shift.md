---
title: Shift
---

**Shift** is a compiled finite-state machine (FSM / HSM). A `.shift` graph becomes **u8 state ids** in `out/`. Invalid transitions are rejected by `CanEnter` / `ChangeState`; hierarchy walks ancestor enter/leave chains. Not [Hive](../hive/) (ECS).

Header: `#include <clpp/libs/shift.clh>` or generated `Npc.clh`. Runtime: `CluauppLibs.Shift`. **Hot path:** one-byte `WriteId` / `ReadId` buffers for [Flare](../flare/) — not JSON.

## Why

- **One byte on the wire.** Replicate state with `WriteId`; apply on clients with `ReadId` (skips guards — server owns truth).
- **Hierarchy.** `state Chase parent Combat` — `OnEnter` / `OnLeave` run along the ancestor chain.
- **Side data** on the machine via `GetData` / `ChangeData` without stringly `OnDataChanged` every frame.

## Schema (`Npc.shift`)

```
opt name = Npc
state Idle
state Combat
state Chase parent Combat
Idle -> Chase when SeePlayer
Chase -> Idle when Lost
```

## Example

```clpp
#include "Npc.clh"

void OnChase() {
	post("chase");
}

void init() {
	ShiftMachine brain = Npc.New();
	brain.Guard("SeePlayer", CanSeePlayer);
	brain.OnEnter("Chase", OnChase);
	brain.ChangeState("Chase");
	buffer id = brain.WriteId();
}
```

Pair [Hive](../hive/) for component columns; Shift for combat / AI **mode**.

## API

### `Shift.New`

**Returns:** `ShiftMachine` (generated `Npc.New()` passes compiled ids, transitions, and parents).

**When:** Create one machine per NPC, weapon mode, or UI flow that needs compiled states.

```clpp
ShiftMachine brain = Shift.New();
```

### `ShiftMachine.ChangeState`

**Returns:** nothing (no-op if destroyed, unknown state, same state, or `CanEnter` is false).

**When:** Authoritative transition on the server (or local-only UI states). Runs leave/enter callbacks along the hierarchy.

```clpp
brain.ChangeState("Idle");
```

### `ShiftMachine.GetState`

**Returns:** `string` — current state name.

**When:** Logging, UI labels, or guards in gameplay code.

```clpp
string s = brain.GetState();
```

### `ShiftMachine.GetCurrentState`

**Returns:** `string` — alias of `GetState`.

**When:** Same as `GetState` when you prefer explicit naming.

```clpp
string s = brain.GetCurrentState();
```

### `ShiftMachine.GetPreviousState`

**Returns:** `string` — state name before the last successful transition.

**When:** “Return to last mode” or animation that depends on where you came from.

```clpp
string prev = brain.GetPreviousState();
```

### `ShiftMachine.GetId`

**Returns:** `int` — current state id (u8 value as number).

**When:** Compare states cheaply or feed non-Shift buffers.

```clpp
int id = brain.GetId();
```

### `ShiftMachine.Guard`

**Returns:** nothing.

**When:** Register a named guard referenced by `when GuardName` edges in the `.shift` file.

```clpp
brain.Guard("SeePlayer", CanSeePlayer);
```

### `ShiftMachine.OnEnter`

**Returns:** nothing (if already in that state when registered, enter runs immediately).

**When:** Start animations, sounds, or Hive queries when a state becomes active.

```clpp
brain.OnEnter("Chase", OnChase);
```

### `ShiftMachine.OnLeave`

**Returns:** nothing.

**When:** Tear down chase VFX or reset timers when leaving a state.

```clpp
brain.OnLeave("Chase", OnLeaveChase);
```

### `ShiftMachine.CanEnter`

**Returns:** `bool` — whether `ChangeState` would succeed from the current state (explicit edges + guards + parent descent).

**When:** UI affordances, AI telegraphs, or client prediction checks before calling `ChangeState`.

```clpp
if (brain.CanEnter("Chase")) {
	brain.ChangeState("Chase");
}
```

### `ShiftMachine.WriteId`

**Returns:** `buffer` — 1 byte: current state id.

**When:** Pack into [Flare](../flare/) packets or any replication that should stay JSON-free.

```clpp
buffer id = brain.WriteId();
```

### `ShiftMachine.ReadId`

**Returns:** nothing.

**When:** Apply replicated state on a client or secondary machine **without re-running guards** (visual sync).

```clpp
brain.ReadId(replicatedBuf);
```

### `ShiftMachine.GetData`

**Returns:** `auto` — mutable string-keyed table on the machine.

**When:** Per-machine blackboard (target id, timer) that is not worth a Hive component.

```clpp
auto data = brain.GetData();
```

### `ShiftMachine.ChangeData`

**Returns:** nothing.

**When:** Set one key on the machine data table.

```clpp
brain.ChangeData("Target", player);
```

### `ShiftMachine.Destroy`

**Returns:** nothing.

**When:** NPC despawn — clears data and callbacks; further transitions are ignored.

```clpp
brain.Destroy();
```
