---
title: Hive
---

**Hive** is a jecs-style ECS: entities, component columns, and iterators. A `.hive` file bakes **u8 component ids**. `Snapshot` writes a **tagged buffer** (nil / bool / number / string / table) for [Flare](../flare/) — not JSON. Not a second [Shift](../shift/).

Header: `#include <clpp/libs/hive.clh>` or generated `NpcWorld.clh`. Runtime: `CluauppLibs.Hive`.

## Why

- **Packed columns.** `Query(Health, Target)` yields `entity, health, target` for every row that has all components.
- **Snapshot is binary.** u8 component id + u32 row count + per-row entity id and tagged values.
- **Server spawns entities.** Clients consume snapshots; they do not create authoritative rows.

## Schema (`NpcWorld.hive`)

```
opt name = NpcWorld
component Health { i32 current, i32 max }
component Target { Player player }
```

## Example

```clpp
#include "NpcWorld.clh"

void init() {
	HiveWorld world = NpcWorld.New();
	int e = world.Entity();
	world.Set(e, NpcWorld.Health, healthRow);
	buffer snap = world.Snapshot(NpcWorld.Health);
}
```

Full loop: [NPC example](../../examples/npc/).

## API

### `Hive.World`

**Returns:** `HiveWorld` (generated wrappers often expose `NpcWorld.World()` with schema baked in). Authoritative by default: `Entity` / `Set` / `Remove` / `Despawn` no-op on the client. Pass `false` as the second argument for a local prediction world.

**When:** One world per match or server realm; hold all NPC / pickup entities.

```clpp
HiveWorld world = Hive.World();
HiveWorld localSim = Hive.World(schema, false);
```

### `Hive.AuthoritativeWorld`

**Returns:** `HiveWorld` with client writes refused.

**When:** Same as `Hive.World` when you want the flag explicit.

```clpp
HiveWorld world = Hive.AuthoritativeWorld(schema);
```

### `HiveWorld.Entity`

**Returns:** `int` — new dense entity id.

**When:** Spawn NPCs, projectiles, or interactables on the **server**.

```clpp
int e = world.Entity();
```

### `HiveWorld.Set`

**Returns:** nothing.

**When:** Write or replace a component value on an entity.

```clpp
world.Set(e, NpcWorld.Health, row);
```

### `HiveWorld.Get`

**Returns:** `auto` — component value or nil if missing.

**When:** Read a single component for one entity.

```clpp
auto hp = world.Get(e, NpcWorld.Health);
```

### `HiveWorld.Remove`

**Returns:** nothing.

**When:** Strip one component without despawning the entity.

```clpp
world.Remove(e, NpcWorld.Target);
```

### `HiveWorld.Despawn`

**Returns:** nothing.

**When:** Remove the entity and clear all its column entries.

```clpp
world.Despawn(e);
```

### `HiveWorld.Has`

**Returns:** `bool` — whether the entity has a non-nil value in that component column.

**When:** Cheap membership before `Get` or query-like branches.

```clpp
if (world.Has(e, NpcWorld.Target)) { }
```

### `HiveWorld.Query`

**Returns:** `auto` — iterator function; call repeatedly until it returns nil. With no component ids, yields entities only; with ids, yields `entity, ...componentValues`.

**When:** Systems that need every row with a given archetype (AI, regen, targeting).

```clpp
auto next = world.Query(NpcWorld.Health, NpcWorld.Target);
```

### `HiveWorld.Snapshot`

**Returns:** `buffer` — packed column for one component id (all entities that have a value in that column).

**When:** Replicate or save one component column over [Flare](../flare/) without JSON.

```clpp
buffer snap = world.Snapshot(NpcWorld.Health);
```
