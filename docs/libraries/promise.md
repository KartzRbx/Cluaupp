---
title: Promise
sidebar_position: 4
---

# Promise

[evaera/roblox-lua-promise](https://github.com/evaera/roblox-lua-promise). Header: `#include <cluaupp/libs/promise.hpp>`.

C++ names `Then` / `Catch` / `Await` / `Cancel` are aliases of `andThen` / `catch` / `await` / `cancel`.

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/promise.hpp>

void AfterWait() {
	print("1s later");
}

void init() {
	Promise::delay(1);
}
```

Useful statics: `Promise::delay(seconds)`, `Promise::resolve(value)`, `Promise::reject("err")`.

Cluaupp cannot nest lambdas. Prefer `delay` plus a named callback you already have, or keep promise chains in Luau libraries you call from C++.
