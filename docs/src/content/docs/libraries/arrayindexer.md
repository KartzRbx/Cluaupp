---
title: ArrayIndexer
---

**ArrayIndexer** hands out dense, reusable integer ids for ECS-style tables: `Acquire` pops a free slot (or grows), `Release` swap-removes from the live list and returns the id to the pool. Field `Next` is the next id when the free list is empty.

Header: `#include <clpp/libs/arrayindexer.clh>`. Runtime: `CluauppLibs.ArrayIndexer`.

## Why

- **Stable packed arrays.** Map `id → component` in a dense array without holes after releases.
- **O(1) acquire and release.** Free list plus swap-remove keeps `Living()` iteration cheap.
- **Not a service registry.** For typed service manifests, use the Luau `Table<Manifest, "ServiceName">` helper described in the runtime — the CL++ header only exposes the indexer struct.

When **not** to use: sequential 1..n indices with no reuse (a plain counter is enough), or global singleton ids shared across unrelated systems without one indexer per domain.

## Example

```clpp
#include <clpp/libs/arrayindexer.clh>

void init() {
	ArrayIndexer ids = ArrayIndexer.New();
	int a = ids.Acquire(); // 1
	int b = ids.Acquire(); // 2
	ids.Release(a);
	int c = ids.Acquire(); // reuses 1
	bool live = ids.Has(b); // true
}
```

## API

### ArrayIndexer.Next

**Returns:** `int` — next id issued when the internal free list is empty (read-only snapshot; runtime mutates this on `Acquire`).

**When:** Debugging or sizing preallocated tables before bulk `Acquire`.

**Example**

```clpp
ArrayIndexer ids = ArrayIndexer.New();
post(ids.Next); // 1
```

### ArrayIndexer.New

**Returns:** `ArrayIndexer` — empty indexer with `Next == 1` and empty free/dense lists.

**When:** One indexer per component type or per entity pool.

**Example**

```clpp
ArrayIndexer ids = ArrayIndexer.New();
```

### ArrayIndexer::Acquire

**Returns:** `int` — a live id (reused from the free list or `Next` before increment).

**When:** Spawning an entity row, subscribing a listener slot, or any reusable handle.

**Example**

```clpp
int id = ids.Acquire(); // 1, then 2, ...
```

### ArrayIndexer::Release

**Returns:** Luau `nil` (no return value). Removes `id` from the dense live list via swap-remove and pushes `id` onto the free list. No-op if `id` is not live.

**When:** Entity destroyed or slot torn down.

**Example**

```clpp
ids.Release(1); // id 1 becomes available for the next Acquire
```

### ArrayIndexer::Has

**Returns:** `bool` — `true` if `id` is currently in the live set.

**When:** Validating handles before array access.

**Example**

```clpp
bool ok = ids.Has(2); // true while id 2 is acquired and not released
```

### ArrayIndexer::Living

**Returns:** `LuaArray<int>` — packed list of all live ids (order is dense storage order, not acquisition order).

**When:** Iterating all active entities each frame.

**Example**

```clpp
LuaArray<int> all = ids.Living(); // e.g. { 2, 3 } after releasing 1
```
