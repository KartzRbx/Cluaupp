---
title: Promise
---

**Promise** is the vendored [evaera/roblox-lua-promise](https://github.com/evaera/roblox-lua-promise) surface exposed to CL++: deferred async results, chaining, aggregation, and `Await` for yield-safe blocking. PascalCase and camelCase method names are both wired to the same runtime.

Header: `#include <clpp/libs/promise.clh>`. Runtime: `CluauppLibs.Promise`.

## Why

- **Compose async work** (DataStore, HTTP, Flare queries) without nested callbacks.
- **Sweep integration** — register with `Sweep.AddPromise` so `Cancel` runs on cleanup.
- **Static helpers** for `all`, `race`, `retry`, and `delay`.

When **not** to use: purely synchronous code, or Roblox-native `task.defer`/`task.wait` flows that do not need cancellation semantics (still fine for one-shot delays via `Promise.delay`).

## Example

```clpp
#include <clpp/libs/promise.clh>
#include <clpp/libs/sweep.clh>

Sweep life = Sweep.New();

void load() {
	Promise p = Promise.New(func (func resolve, func reject) {
		resolve(42);
	});
	life.AddPromise(p.Then(func (int v) {
		post(v); // 42
	}));
}
```

## API

### Promise.New

**Returns:** `Promise` — pending promise running `executor(resolve, reject)`.

**When:** Wrapping callback-based APIs into a promise.

**Example**

```clpp
Promise p = Promise.New(func (func resolve, func reject) {
	resolve("ok"); // fulfills with "ok"
});
```

### Promise.resolve

**Returns:** `Promise` — already fulfilled with `value`.

**When:** Starting a chain from a known value.

**Example**

```clpp
Promise p = Promise.resolve(10); // fulfilled
```

### Promise.reject

**Returns:** `Promise` — rejected with string `err`.

**When:** Immediate failure without throwing.

**Example**

```clpp
Promise p = Promise.reject("nope"); // rejected
```

### Promise.delay

**Returns:** `Promise` — fulfills after `seconds` (scheduler-based).

**When:** Timed continuations without manual `task.wait`.

**Example**

```clpp
Promise p = Promise.delay(1.0); // fulfills ~1s later
```

### Promise.try_

**Returns:** `Promise` — fulfills with the return of `callback`, or rejects if `callback` errors.

**When:** Wrapping a function that might throw.

**Example**

```clpp
Promise p = Promise.try_(func () {
	return 5; // fulfills with 5
});
```

### Promise.all

**Returns:** `Promise` — fulfills with an array of results when every input promise fulfills; rejects if any input rejects.

**When:** Parallel steps that must all succeed.

**Example**

```clpp
LuaArray<Promise> list = { Promise.resolve(1), Promise.resolve(2) };
Promise p = Promise.all(list); // fulfills with { 1, 2 }
```

### Promise.race

**Returns:** `Promise` — adopts the first settled input promise.

**When:** Timeout races or first-response wins.

**Example**

```clpp
Promise p = Promise.race({ Promise.delay(5), Promise.resolve(1) }); // fulfills with 1
```

### Promise.retry

**Returns:** `Promise` — runs `callback` up to `times` until it fulfills.

**When:** Flaky network or DataStore retries.

**Example**

```clpp
Promise p = Promise.retry(func () {
	return Promise.resolve(1);
}, 3);
```

### Promise::Then

**Returns:** `Promise` — chained promise; `ok` runs on fulfill.

**When:** Mapping or sequencing async results (PascalCase alias of `andThen`).

**Example**

```clpp
Promise next = Promise.resolve(2).Then(func (int v) {
	return v + 1; // next fulfills with 3
});
```

### Promise::Catch

**Returns:** `Promise` — recovery handler on reject (alias of `catch_`).

**When:** Logging or fallback values.

**Example**

```clpp
Promise p = Promise.reject("x").Catch(func (string e) {
	return 0; // fulfills with 0
});
```

### Promise::Finally

**Returns:** `Promise` — runs `callback` on settle; preserves prior result (alias of `finally`).

**When:** Cleanup that must run on success or failure.

**Example**

```clpp
Promise.resolve(1).Finally(func () {
	post("done");
});
```

### Promise::andThen

**Returns:** `Promise` — same as `Then`.

**When:** Prefer camelCase to match Luau examples.

**Example**

```clpp
Promise.resolve(1).andThen(func (int v) { return v; });
```

### Promise::catch_

**Returns:** `Promise` — same as `Catch`.

**When:** Prefer camelCase rejection handler.

**Example**

```clpp
Promise.reject("e").catch_(func (string e) { return nil; });
```

### Promise::finally

**Returns:** `Promise` — same as `Finally`.

**When:** camelCase finally hook.

**Example**

```clpp
Promise.resolve(1).finally(func () {});
```

### Promise::Await

**Returns:** `auto` — fulfillment values, or throws on reject (yields the calling thread).

**When:** CL++ code that must block until a promise settles (use sparingly on critical paths).

**Example**

```clpp
int v = Promise.resolve(9).Await(); // 9
```

### Promise::Cancel

**Returns:** Luau `nil`. Attempts cancellation (alias of `cancel`).

**When:** Player left or Sweep cleanup.

**Example**

```clpp
p.Cancel();
```

### Promise::cancel

**Returns:** Luau `nil`. Same as `Cancel`.

**When:** camelCase cancel.

**Example**

```clpp
p.cancel();
```

### Promise::GetStatus

**Returns:** `string` — status name (`Started`, `Resolved`, `Rejected`, `Cancelled`, …).

**When:** Branching before `Await`.

**Example**

```clpp
string s = Promise.resolve(1).GetStatus(); // "Resolved"
```

### Promise::getStatus

**Returns:** `string` — same as `GetStatus`.

**When:** camelCase status read.

**Example**

```clpp
string s = p.getStatus();
```
