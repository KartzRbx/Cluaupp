---
title: Net
sidebar_position: 5
---

# Net

Buffer-packed remotes. Header: `#include <cluaupp/libs/net.hpp>`. Same name on server and client — you do not create `RemoteEvent` instances yourself.

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/janitor.hpp>

void OnCoins(Player* player, int amount) {
	return;
}

void init() {
	auto* janitor = new Janitor();
	auto* coins = Net::Event("Coins");
	coins->On(OnCoins);
	janitor->Add(coins);
}
```

| Side | API |
| --- | --- |
| Server | `Fire(player, ...)`, `FireAll(...)` |
| Client | `FireServer(...)` |
| Both | `On(callback)` |

Functions: `Net::Function("Shop")`, then `Invoke` / `InvokeServer`.

Validate everything the client fires. See [safety](../cpp-safety.md). Full copies: [Combat](../examples/combat.md), [Shop](../examples/shop.md).
