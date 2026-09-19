---
title: Promise
---

[evaera/roblox-lua-promise](https://github.com/evaera/roblox-lua-promise). Header: `#include <clpp/libs/promise.clh>`.

C++ names `Then` / `Catch` / `Await` / `Cancel` are aliases of `andThen` / `catch` / `await` / `cancel`.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/promise.clh>

void AfterWait() {
	post("1s later");
}

void init() {
	Promise::delay(1);
}
```

Useful statics: `Promise::delay(seconds)`, `Promise::resolve(value)`, `Promise::reject("err")`.

Cluaupp cannot nest lambdas. Prefer `delay` plus a named callback you already have, or keep promise chains in Luau libraries you call from C++.
