---
title: Sweep
---

**Sweep** is Cluaupp’s zelador (janitor): register instances, connections, threads, functions, promises, and Sparks; `Cleanup` or `Destroy` runs the right teardown (`Disconnect`, `Destroy`, `Cancel`, etc.). Indexed `Add` replaces and cleans the previous entry. `~>` on a Spark connects through the active Sweep. [Flare](/libraries/flare/) sends; Sweep clears.

Header: `#include <clpp/libs/sweep.clh>`. Runtime: `CluauppLibs.Sweep`.

## Why

- **One place to tear down** a feature when a player leaves, UI closes, or a round ends.
- **Auto-detect** cleanup method when you only pass the object.
- **LinkToInstance** destroys the sweep when an `Instance` is destroyed or unparented.

When **not** to use: global singletons that live for the whole server (still use Sweep per-player scopes), or when Roblox `Debris` alone is enough for simple instance TTL.

## Example

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/spark.clh>
#include <clpp/libs/sweep.clh>

Sweep life = Sweep.New();

void mount(Player player) {
	life.LinkToInstance(player.Character);
	Spark Died = new Spark();
	Died~>Connect(func () { post("died"); });
	life.Add(Died, "DiedSignal");
}
```

## API

### Sweep.CurrentlyCleaning

**Returns:** `bool` field — `true` while `Cleanup` is running.

**When:** Avoid re-entrant `Add` during cleanup (adds are ignored when cleaning or frozen).

**Example**

```clpp
bool busy = life.CurrentlyCleaning; // false in normal use
```

### Sweep.New

**Returns:** `Sweep` — empty task list.

**When:** Per-feature or per-player lifetime.

**Example**

```clpp
Sweep life = Sweep.New();
```

### Sweep::Add (object)

**Returns:** `auto` — the same `object` (for chaining). Detects `Disconnect` / `Destroy` / `Cancel` / call semantics.

**When:** Registering a connection, instance, thread, function, promise, or Spark.

**Example**

```clpp
life.Add(connection); // Disconnect on Cleanup
```

### Sweep::Add (object, callDirectly)

**Returns:** `auto` — `object`. If `callDirectly` is `true`, cleanup calls `object()`; if `false`, uses detection.

**When:** Forcing call-vs-method behavior.

**Example**

```clpp
life.Add(func () { post("bye"); }, true); // invokes function on cleanup
```

### Sweep::Add (object, methodName)

**Returns:** `auto` — `object`. Cleanup calls `object[methodName](object)` (special-case `Destroy` on instances uses `pcall`).

**When:** Objects with a nonstandard cleanup method name.

**Example**

```clpp
life.Add(signal, "DisconnectAll");
```

### Sweep::Add (object, methodName, index)

**Returns:** `auto` — `object`. Replaces any prior entry at `index`, cleaning it first.

**When:** Named slots (`"HUD"`, `"DiedSignal"`) that hot-swap.

**Example**

```clpp
life.Add(gui, "Destroy", "HUD");
life.Add(newGui, "Destroy", "HUD"); // old gui Destroyed first
```

### Sweep::AddPromise

**Returns:** `auto` — the promise. Cleanup calls `Cancel`.

**When:** Async work tied to UI or player scope.

**Example**

```clpp
life.AddPromise(Promise.delay(5));
```

### Sweep::AddPromise (promise, index)

**Returns:** `auto` — indexed promise slot (replaces previous).

**When:** One active load per key.

**Example**

```clpp
life.AddPromise(loadPromise, "Load");
```

### Sweep::Remove

**Returns:** `Sweep` — `this` for chaining. Runs cleanup for the indexed entry and removes it.

**When:** Tear down one slot early.

**Example**

```clpp
life.Remove("HUD");
```

### Sweep::RemoveNoClean

**Returns:** `Sweep` — `this`. Drops the indexed entry without running cleanup.

**When:** Ownership moved elsewhere.

**Example**

```clpp
life.RemoveNoClean("HUD");
```

### Sweep::Get

**Returns:** `auto` — object at `index`, or Luau `nil`.

**When:** Retrieving a registered handle.

**Example**

```clpp
Spark s = life.Get("DiedSignal");
```

### Sweep::Cleanup

**Returns:** Luau `nil`. Runs all tasks LIFO, clears indices (not frozen).

**When:** Reset without forbidding future `Add` (unlike `Destroy`).

**Example**

```clpp
life.Cleanup();
```

### Sweep::Destroy

**Returns:** Luau `nil`. `Cleanup`, then freeze (no more adds) and disconnect `LinkToInstance` links.

**When:** Final teardown.

**Example**

```clpp
life.Destroy();
```

### Sweep::LinkToInstance

**Returns:** `RBXScriptConnection` — `Destroying` connection (also tracks ancestry). Calls `Destroy` on the sweep when the instance is gone.

**When:** UI or character-bound systems.

**Example**

```clpp
life.LinkToInstance(part); // sweep dies with part
```

### Sweep::LinkToInstance (object, allowMultiple)

**Returns:** `RBXScriptConnection`. When `allowMultiple` is `false` (default), replaces the prior `"LinkToInstance"` slot.

**When:** Multiple instances should share one sweep lifetime.

**Example**

```clpp
life.LinkToInstance(model, true);
```

### Sweep.Is

**Returns:** `bool` — `true` for Sweep instances.

**When:** Type checks.

**Example**

```clpp
bool ok = Sweep.Is(life); // true
```
