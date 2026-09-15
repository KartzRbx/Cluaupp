---
title: Safety
sidebar_position: 12
---

# Safety

Safety in Cluaupp is not a sandbox flag. It is a set of habits the compiler and libraries make cheap.

## 1. Never trust the client

[Net](libraries.md) lets a client `FireServer`. The server must validate:

```cpp
void OnBuy(Player* player, int productId) {
	if (productId < 1) {
		return;
	}
	int price = PriceOf(productId);
	int coins = DataService::Get(player, "Currencies.Coins");
	if (coins < price) {
		return;
	}
	DataService::Set(player, "Currencies.Coins", coins - price);
}
```

Do not store coins only on the client. Do not let the client pass the new coin total — pass the *intent* (`productId`).

## 2. Clean up with Janitor

Every `Connect` that outlives a player, a GUI, or a tool needs a Janitor. Leaving a step, destroying a character, or closing a menu should `Cleanup()` or `LinkToInstance`.

```cpp
auto* janitor = new Janitor();
janitor->LinkToInstance(player);
janitor->Add(players->PlayerAdded.Connect(OnPlayer));
```

Leaked connections duplicate effects: double coins, stacked cameras, lingering highlights.

## 3. Check nil

`FindFirstChild` returns `nullptr`. `WaitForChild` can hang. Prefer `FindFirstChild` plus an early return on the hot path.

## 4. One writer for persisted data

[DataServiceV2](https://wally.run/package/kartzrbx/dataservicev2) distinguishes `Get()` (merged, includes transient admin overlays) from `GetPersisted()` (what ProfileStore will save). Use `SetTransient` for test panels so you never persist cheat values. Only the server writes persisted paths.

## 5. Buffers, not ad-hoc strings

`Net` packs arguments into a `buffer`. That is smaller and typed. Do not `JSONEncode` a whole inventory on every heartbeat. Send deltas. Cap array lengths the client can send.

## 6. Names are API

Remote names (`Net::Event("Coins")`) are public protocol. Keep them `const`, short, and unique. Changing a name without a migration breaks old clients.

Next: [organization](cpp-organization.md).
