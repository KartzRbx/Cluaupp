---
title: HUD
sidebar_position: 6
---

# HUD

Client-only: wait for the replicated profile, write labels, listen for currency changes. No `Set` on persisted paths from the client.

Put a ScreenGui named `Hud` in StarterGui with `MoneyLabel` and `LevelLabel` (`TextLabel`).

Define callbacks **above** `init()` or use lambdas in `Connect`.

## `HudClient.client.cpp`

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include <cluaupp/libs/formatnumber.hpp>
#include <cluaupp/libs/twinkle.hpp>

Players* Players = GetService<Players>();
Janitor* janitor = new Janitor();

TextLabel* FindLabel(PlayerGui* playerGui, string name) {
	if (playerGui == nullptr) {
		return nullptr;
	}
	Instance* gui = playerGui->FindFirstChild("Hud");
	if (gui == nullptr) {
		return nullptr;
	}
	return gui->FindFirstChild(name);
}

void Render(Data* data, TextLabel* moneyLabel, TextLabel* levelLabel) {
	if (data == nullptr) {
		return;
	}
	int money = data->Get(DataService::Client.Paths.Currencies.Money);
	int level = data->Get(DataService::Client.Paths.Currencies.Level);
	if (moneyLabel != nullptr) {
		moneyLabel->Text = FormatNumber::Abbreviate(money);
	}
	if (levelLabel != nullptr) {
		levelLabel->Text = FormatNumber::Comma(level);
	}
}

void OnCurrenciesChanged() {
	Player* player = Players->LocalPlayer;
	if (player == nullptr) {
		return;
	}
	PlayerGui* playerGui = player->FindFirstChildOfClass("PlayerGui");
	TextLabel* moneyLabel = FindLabel(playerGui, "MoneyLabel");
	TextLabel* levelLabel = FindLabel(playerGui, "LevelLabel");
	Render(DataService::Client.Get(), moneyLabel, levelLabel);
}

void init() {
	Player* player = Players->LocalPlayer;
	if (player == nullptr) {
		return;
	}
	PlayerGui* playerGui = player->FindFirstChildOfClass("PlayerGui");
	if (playerGui == nullptr) {
		return;
	}

	Data* data = DataService::Client.WaitForData();
	if (data == nullptr) {
		cout::warn << "HUD: profile missing" << endl;
		return;
	}

	TextLabel* moneyLabel = FindLabel(playerGui, "MoneyLabel");
	TextLabel* levelLabel = FindLabel(playerGui, "LevelLabel");
	Render(data, moneyLabel, levelLabel);

	if (moneyLabel != nullptr) {
		Twinkle::Fade(moneyLabel, true);
	}

	janitor->Add(data->GetChangedSignal(DataService::Client.Paths.Currencies).Connect(OnCurrenciesChanged));
}
```

## Rules

- Call `DataService::Client.Init()` in [Data boot](data-boot.md) first. Script order in StarterPlayerScripts is not a contract — `WaitForData` yields until the profile exists.
- Do not `data->Set` Money from the HUD. Display only.
- `Twinkle::Fade` is optional. See [more libraries](../libraries/more.md).

`HudClient.client.cpp` is a LocalScript (`init.client.luau`).
