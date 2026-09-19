---
title: Net
---

Buffer-packed remotes. Header: `#include <clpp/libs/net.hpp>`. Same name on server and client — you do not create `RemoteEvent` instances yourself.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/net.hpp>
#include <clpp/libs/janitor.clh>

void OnCoins(Player player, int amount) {
	return;
}

void init() {
	auto janitor = new Janitor();
	auto coins = Net::Event("Coins");
	coins.On(OnCoins);
	janitor.Add(coins);
}
```

| Side | API |
| --- | --- |
| Server | `Fire(player, ...)`, `FireAll(...)` |
| Client | `FireServer(...)` |
| Both | `On(callback)` |

Functions: `Net::Function("Shop")`, then `Invoke` / `InvokeServer`.

Validate everything the client fires. See [safety](/language/safety/). Full copies: [Combat](../examples/combat.md), [Shop](../examples/shop.md).
