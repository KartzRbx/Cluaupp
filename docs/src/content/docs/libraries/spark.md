---
title: Spark
---

**Spark** is an engine-grade, yield-safe signal: O(1) disconnect, pooled serial runners, queued reentrant `Fire`, and parallel connections that do not poison the pool. Bind listeners with [Sweep](/libraries/sweep/) using `~>` so teardown disconnects automatically. `Spark.Wrap` adapts an `RBXScriptSignal`.

Header: `#include <clpp/libs/spark.clh>`. Runtime: `CluauppLibs.Spark`.

## Why

- **Local events** (`Hit`, `Ready`, `CoinsChanged`) without `BindableEvent` overhead.
- **Yield inside handlers** on serial connections; use `ConnectParallel` when Parallel Luau must not share the pooled runner.
- **Hard limits** — destroyed signals seal; reentrant fire queue (cap 64); listener cap 4096.

When **not** to use: cross-network events ([Flare](/libraries/flare/) generated `Net.*`), or Roblox-only signals you already own (wrap with `Spark.Wrap` if you need Sweep `~>` either way).

## Example

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/spark.clh>
#include <clpp/libs/sweep.clh>

Spark OnHit = new Spark();
Sweep life = Sweep.New();

void init() {
	OnHit~>Connect(func () {
		post("hit"); // runs on Fire
	});
	OnHit.Fire();
}
```

## API

### SparkConnection.Connected

**Returns:** `bool` field — `false` after `Disconnect` / `Destroy`.

**When:** Checking whether a stored connection handle is still active.

**Example**

```clpp
SparkConnection c = OnHit.Connect(func () {});
bool live = c.Connected; // true until Disconnect
```

### SparkConnection::Disconnect

**Returns:** Luau `nil`. O(1) unlink; handler closure is not retained by the signal.

**When:** One-off unsubscribe without tearing down the whole Spark.

**Example**

```clpp
c.Disconnect(); // c.Connected == false
```

### SparkConnection::Destroy

**Returns:** Luau `nil`. Alias of `Disconnect`.

**When:** Symmetry with Instance teardown APIs.

**Example**

```clpp
c.Destroy();
```

### Spark.New

**Returns:** `Spark` — empty signal.

**When:** Creating a custom event bus.

**Example**

```clpp
Spark s = Spark.New();
```

### Spark.Wrap

**Returns:** `Spark` — forwards fires from `rbx` into the Spark.

**When:** Sweep-owned listeners on engine signals (`Instance.Destroying`, etc.).

**Example**

```clpp
Spark s = Spark.Wrap(part.Destroying);
```

### Spark.Is

**Returns:** `bool` — `true` if `obj` is a Spark instance.

**When:** Type guards in generic utilities.

**Example**

```clpp
bool ok = Spark.Is(OnHit); // true
```

### Spark::Fire

**Returns:** Luau `nil`. Runs connected serial handlers (and parallel handlers on their own threads) with the signal’s payload.

**When:** Immediate dispatch.

**Example**

```clpp
OnHit.Fire(); // listeners run now
```

### Spark::FireDeferred

**Returns:** Luau `nil`. Schedules handlers on the next resumption (deferred), not nested inside an in-flight `Fire`.

**When:** Avoiding reentrancy while already handling a fire.

**Example**

```clpp
OnHit.FireDeferred();
```

### Spark::Connect

**Returns:** `SparkConnection` — pooled serial runner.

**When:** Default listener; may yield.

**Example**

```clpp
SparkConnection c = OnHit.Connect(func () { post(1); });
```

### Spark::ConnectParallel

**Returns:** `SparkConnection` — dedicated thread per invocation.

**When:** Parallel Luau work without blocking the serial pool.

**Example**

```clpp
OnHit.ConnectParallel(func () { /* parallel-safe */ });
```

### Spark::Once

**Returns:** `SparkConnection` — serial, auto-disconnects after first fire.

**When:** One-shot setup or welcome handlers.

**Example**

```clpp
OnHit.Once(func () { post("once"); });
```

### Spark::OnceParallel

**Returns:** `SparkConnection` — parallel once listener.

**When:** One-shot parallel handler.

**Example**

```clpp
OnHit.OnceParallel(func () {});
```

### Spark::ConnectOnce

**Returns:** `SparkConnection` — same semantics as `Once` (serial).

**When:** Naming parity with Roblox `ConnectOnce`.

**Example**

```clpp
OnHit.ConnectOnce(func () {});
```

### Spark::DisconnectAll

**Returns:** Luau `nil`. Drops every connection and cancels threads blocked in `Wait`.

**When:** Resetting a module without destroying the Spark object.

**Example**

```clpp
OnHit.DisconnectAll();
```

### Spark::GetConnections

**Returns:** `LuaArray<SparkConnection>` — snapshot of live connections.

**When:** Debugging listener leaks.

**Example**

```clpp
LuaArray<SparkConnection> list = OnHit.GetConnections();
```

### Spark::IsDestroyed

**Returns:** `bool` — `true` after `Destroy`.

**When:** Guarding late fires.

**Example**

```clpp
bool dead = OnHit.IsDestroyed(); // false until Destroy
```

### Spark::Wait

**Returns:** `auto` — values passed to the next `Fire` (yields until fired).

**When:** Coroutine-style waiting (like `RBXScriptSignal:Wait`).

**Example**

```clpp
OnHit.Fire();
// in another thread: OnHit.Wait() resumes after Fire payload
```

### Spark::Destroy

**Returns:** Luau `nil`. Seals the signal, disconnects all, clears waiters.

**When:** Permanent shutdown (often via Sweep).

**Example**

```clpp
OnHit.Destroy(); // further Connect returns dead connections
```
