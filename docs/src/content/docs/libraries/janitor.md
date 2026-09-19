---
title: Janitor
---

Cleans connections, instances, promises, and threads. Header: `#include <clpp/libs/janitor.clh>`. Runtime is [howmanysmall/Janitor](https://github.com/howmanysmall/Janitor). Types come from `_impl` — there is no fake `Has` method.

## Create and add

```clpp
auto janitor = new Janitor();

janitor.Add(Players.PlayerAdded~>Connect(OnPlayer));
janitor.Add(part, "Destroy");
janitor.Add(func () { post("cleanup"); }, true);
```

| Call | Cleanup |
| --- | --- |
| `Add(connection)` | `Disconnect` |
| `Add(instance)` / `Add(instance, "Destroy")` | `Destroy` |
| `Add(fn, true)` | call the function |
| `Add(thread, true)` | `task.cancel` |

## Indexed slots (per player)

The third argument is a namespace. Adding again with the same index removes the previous task first.

```clpp
janitor.Add(sectionJanitor, "Destroy", player.Name);

if (janitor.Get(player.Name)) {
	janitor.Remove(player.Name);
}
```

`Remove` on a missing index is a no-op. There is **no** `Has` — use `Get`.

## Lifetime

```clpp
janitor.Cleanup();
janitor.Destroy();
janitor.LinkToInstance(player);
```

- `Cleanup` — run every task, janitor stays usable.
- `Destroy` — cleanup and freeze the object.
- `LinkToInstance` — cleanup when that Instance is destroyed.

## Promises

```clpp
#include <clpp/libs/promise.clh>

janitor.AddPromise(Promise::delay(1));
```

Cleanup cancels or rejects the promise when the janitor runs.

## Pattern

One janitor for the script. A **child** janitor per player, stored under `player.Name`, removed on `PlayerRemoving`. Copy: [Leaderstats](/examples/leaderstats/).
