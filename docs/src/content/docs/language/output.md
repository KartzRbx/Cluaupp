---
title: Output
---

CL++ I/O is `post` / `warn` / `report`. Those emit Roblox `print` / `warn` / `error`. Do not write `print`, `error`, or `cout` in CL++ source.

```clpp
post("ok");
warn("careful");
report("fail");
post("EnsureStat: " .: name .: " not found");
post("hello, " .: player.Name);
```

```luau
print("ok")
warn("careful")
error("fail")
print("EnsureStat: " .. name .. " not found")
print("hello, " .. player.Name)
```

| CL++ | Luau |
| --- | --- |
| `post(...)` | `print(...)` |
| `warn(...)` | `warn(...)` |
| `report(...)` | `error(...)` |
| `to_string(x)` | `tostring(x)` |
| `to_number(x)` | `tonumber(x)` (fail → `nil`) |
| `to_bool(x)` | `not not x` |

Concat with `.:`, never `+` and never Luau `..` in CL++ source.

`#include <clpp/roblox.clh>` declares these builtins for IntelliSense.
