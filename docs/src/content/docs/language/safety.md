---
title: Safety
---

Safety in Cluaupp is not a sandbox flag. It is **Context Safety at compile time** plus habits the libraries make cheap.

## 0. Context Safety (compile)

`.server.clpp` / `.client.clpp` / `.plugin.clpp` attach a capability set. Illegal APIs fail the build — for example `LocalPlayer` on the server or `DataStoreService` on the client. See [Context Safety](../../architecture/context-safety/).

## 1. Never trust the client

Prefer [Flare](../../libraries/flare/) contracts (or [Net](../../libraries/net/) only when you must). The server must validate:

```clpp
void OnBuy(Player player, int productId) {
	if (productId < 1) {
		return;
	}
	int price = PriceOf(productId);
	Data data = DataService.Server.WaitFor(player);
	if (data == null) {
		return;
	}
	int coins = data.Get(DataService.Server.Paths.Currencies.Money);
	if (coins < price) {
		return;
	}
	data.Set(DataService.Server.Paths.Currencies.Money, coins - price);
}
```

Do not store coins only on the client. Do not let the client pass the new coin total — pass the *intent* (`productId`). Full systems: [Shop](../../examples/shop/), [Combat](../../examples/combat/).

## 2. Clean up with Sweep

Every `Connect` that outlives a player, a GUI, or a tool needs a [Sweep](../../libraries/sweep/). Leaving a step, destroying a character, or closing a menu should `Cleanup()` or `LinkToInstance`.

```clpp
auto sweep = new Sweep();
sweep.LinkToInstance(player);
sweep.Add(players.PlayerAdded~>Connect(OnPlayer));
```

Leaked connections duplicate effects: double coins, stacked cameras, lingering highlights.

## 3. Check nil

`FindFirstChild` returns `null`. `WaitForChild` can hang. Prefer `FindFirstChild` plus an early return on the hot path.

## 4. One writer for persisted data

[Keep](../../libraries/keep/) distinguishes `Get()` (merged, includes transient admin overlays) from `GetPersisted()` (what Keep will save). Use `SetTransient` for test panels so you never persist cheat values. Only the server writes persisted paths. The save **shape** is your Template — the library does not ship `Currencies`.

## 5. Buffers, not ad-hoc strings

`Net` packs arguments into a `buffer`. That is smaller and typed. Do not `JSONEncode` a whole inventory on every heartbeat. Send deltas. Cap array lengths the client can send.

## 6. Names are API

Remote names (`Net::Event("Coins")`) are public protocol. Keep them `const`, short, and unique. Changing a name without a migration breaks old clients.

Next: [organization](../organization/), [OOP](../oop/), [Examples](../../examples/), [Why Cluaupp](../../why-cluaupp/).
