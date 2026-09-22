---
title: Shop
---

The client sends **which product**. The server looks up the price, checks Money, then `Set`. Never let the client send the new balance or the price.

## Catalog header

`src/shared/constants/ShopCatalog.hpp`

Cluaupp has no maps. A function with early returns is the catalog.

```clpp
#pragma once

const int PRODUCT_HEALTH_PACK = 1;
const int PRODUCT_SPEED_TOME = 2;

int PriceOf(int productId) {
	if (productId == PRODUCT_HEALTH_PACK) {
		return 50;
	}
	if (productId == PRODUCT_SPEED_TOME) {
		return 200;
	}
	return 0;
}
```

`PriceOf` lives in a header so the **server** is the copy that matters. The client may include it for UI labels, but a patched client cannot change what the server charges.

## Server — `ShopServer.server.clpp`

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>
#include <clpp/libs/net.hpp>
#include <clpp/libs/keep.clh>
#include "../../../shared/constants/ShopCatalog.hpp"

Janitor janitor = new Janitor();
NetEvent* Buy = Net::Event("Buy");

void ApplyProduct(Player player, int productId) {
	Model character = player.Character;
	if (character == null) {
		return;
	}
	Humanoid humanoid = character.FindFirstChildOfClass("Humanoid");
	if (humanoid == null) {
		return;
	}
	if (productId == PRODUCT_HEALTH_PACK) {
		humanoid.Health = humanoid.MaxHealth;
		return;
	}
	if (productId == PRODUCT_SPEED_TOME) {
		humanoid.WalkSpeed = 24;
		return;
	}
}

void OnBuy(Player player, int productId) {
	int price = PriceOf(productId);
	if (price < 1) {
		warn("unknown product " .: productId);
		return;
	}
	Data data = DataService.Server.WaitFor(player);
	if (data == null) {
		return;
	}
	int money = data.Get(DataService.Server.Paths.Currencies.Money);
	if (money < price) {
		post(player.Name .: " cannot afford " .: productId);
		return;
	}
	data.Set(DataService.Server.Paths.Currencies.Money, money - price);
	ApplyProduct(player, productId);
}

void init() {
	Buy.On(OnBuy);
	janitor.Add(Buy);
}
```

Debit **before** (or atomically with) the effect. If you grant the item first and the `Set` fails, the player dupes.

## Client — `ShopClient.client.clpp`

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>
#include <clpp/libs/net.hpp>
#include "../../../shared/constants/ShopCatalog.hpp"

Janitor janitor = new Janitor();
NetEvent* Buy = Net::Event("Buy");

void OnHealthPackClicked() {
	Buy.FireServer(PRODUCT_HEALTH_PACK);
}

void init() {
	return;
}
```

Wire `OnHealthPackClicked` to a `TextButton.MouseButton1Click.Connect(OnHealthPackClicked)` when you have the GUI. The remote payload is only the product id.

## Rules

- `productId < 1` / unknown id → `PriceOf` returns `0` → reject.
- Do not `FireServer(price)` or `FireServer(newMoney)`.
- [Leaderstats](../leaderstats/) updates from `GetChangedSignal` after `Set`.
- Same Net name `"Buy"` on both sides.

See [Safety](../../language/safety/).
