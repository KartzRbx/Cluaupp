---
title: Combat (server validation)
sidebar_position: 4
---

# Combat (server validation)

The client never sends **damage**. It sends **who I want to hit**. The server decides range, cooldown, alive state, and the damage constant.

Pair with [Data boot](data-boot.md) if a kill should grant Money.

## Shared config

`src/shared/constants/CombatConfig.hpp`

```cpp
#pragma once

const double ATTACK_RANGE = 12;
const double ATTACK_COOLDOWN = 0.4;
const int ATTACK_DAMAGE = 12;
const int KILL_REWARD = 5;
```

Keep numbers in a header. Both server and client can include range for FX; **only the server** applies `TakeDamage`.

## Server — `CombatServer.server.cpp`

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>
#include <cluaupp/libs/dataservice.hpp>
#include "../../../shared/constants/CombatConfig.hpp"

Players* Players = GetService<Players>();
Janitor* janitor = new Janitor();
NetEvent* Attack = Net::Event("Attack");

BasePart* RootPart(Model* character) {
	if (character == nullptr) {
		return nullptr;
	}
	return character->FindFirstChild("HumanoidRootPart");
}

Humanoid* HumanoidOf(Model* character) {
	if (character == nullptr) {
		return nullptr;
	}
	return character->FindFirstChildOfClass("Humanoid");
}

bool InRange(Model* a, Model* b, double maxRange) {
	BasePart* rootA = RootPart(a);
	BasePart* rootB = RootPart(b);
	if (rootA == nullptr) {
		return false;
	}
	if (rootB == nullptr) {
		return false;
	}
	Vector3 delta = rootA->Position - rootB->Position;
	if (delta.Magnitude > maxRange) {
		return false;
	}
	return true;
}

bool OnCooldown(Player* attacker) {
	NumberValue* last = attacker->FindFirstChild("LastAttackAt");
	if (last == nullptr) {
		return false;
	}
	if (tick() - last->Value < ATTACK_COOLDOWN) {
		return true;
	}
	return false;
}

void MarkAttack(Player* attacker) {
	NumberValue* last = attacker->FindFirstChild("LastAttackAt");
	if (last == nullptr) {
		last = new NumberValue(attacker);
		last->Name = "LastAttackAt";
	}
	last->Value = tick();
}

void RewardKill(Player* attacker) {
	Data* data = DataService::Server.Get(attacker);
	if (data == nullptr) {
		return;
	}
	int money = data->Get(DataService::Server.Paths.Currencies.Money);
	data->Set(DataService::Server.Paths.Currencies.Money, money + KILL_REWARD);
}

void OnAttack(Player* attacker, int targetUserId) {
	if (attacker == nullptr) {
		return;
	}
	if (targetUserId < 1) {
		return;
	}
	if (OnCooldown(attacker)) {
		return;
	}

	Player* target = Players->GetPlayerByUserId(targetUserId);
	if (target == nullptr) {
		return;
	}
	if (target == attacker) {
		return;
	}

	Model* attackerChar = attacker->Character;
	Model* targetChar = target->Character;
	Humanoid* attackerHum = HumanoidOf(attackerChar);
	Humanoid* targetHum = HumanoidOf(targetChar);
	if (attackerHum == nullptr) {
		return;
	}
	if (targetHum == nullptr) {
		return;
	}
	if (attackerHum->Health <= 0) {
		return;
	}
	if (targetHum->Health <= 0) {
		return;
	}
	if (InRange(attackerChar, targetChar, ATTACK_RANGE) == false) {
		cout::ping << attacker->Name << " out of range" << endl;
		return;
	}

	MarkAttack(attacker);
	double healthBefore = targetHum->Health;
	targetHum->TakeDamage(ATTACK_DAMAGE);
	if (healthBefore > 0) {
		if (targetHum->Health <= 0) {
			RewardKill(attacker);
		}
	}
}

void init() {
	Attack->On(OnAttack);
	janitor->Add(Attack);
}
```

## Client — `CombatClient.client.cpp`

The LocalScript only picks a target and fires. It does **not** pass `ATTACK_DAMAGE`.

```cpp
#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include <cluaupp/libs/net.hpp>

Players* Players = GetService<Players>();
UserInputService* UserInput = GetService<UserInputService>();
Janitor* janitor = new Janitor();
NetEvent* Attack = Net::Event("Attack");

Player* PlayerFromPart(Instance* part) {
	if (part == nullptr) {
		return nullptr;
	}
	Instance* model = part->FindFirstAncestorOfClass("Model");
	if (model == nullptr) {
		return nullptr;
	}
	Player* fromModel = Players->GetPlayerFromCharacter(model);
	if (fromModel != nullptr) {
		return fromModel;
	}
	Instance* outer = model->FindFirstAncestorOfClass("Model");
	if (outer == nullptr) {
		return nullptr;
	}
	return Players->GetPlayerFromCharacter(outer);
}

void OnInputBegan(InputObject* input, bool gameProcessed) {
	if (gameProcessed) {
		return;
	}
	if (input->UserInputType != Enum::UserInputType::MouseButton1) {
		return;
	}
	Player* localPlayer = Players->LocalPlayer;
	if (localPlayer == nullptr) {
		return;
	}
	Mouse* mouse = localPlayer->GetMouse();
	if (mouse == nullptr) {
		return;
	}
	Player* target = PlayerFromPart(mouse->Target);
	if (target == nullptr) {
		return;
	}
	if (target == localPlayer) {
		return;
	}
	Attack->FireServer(target->UserId);
}

void init() {
	janitor->Add(UserInput->InputBegan.Connect(OnInputBegan));
}
```

## What the server rejects

| Client cheat | Server check |
| --- | --- |
| `FireServer(99999)` damage | Damage is `ATTACK_DAMAGE` in the header — not an argument |
| Hit a player across the map | `delta.Magnitude > ATTACK_RANGE` |
| Spam click | `LastAttackAt` + `ATTACK_COOLDOWN` |
| Target userId `0` / self | `targetUserId < 1`, `target == attacker` |
| Hit a dead / missing character | Humanoid nil or `Health <= 0` |
| Fire before spawn | `Character` / `HumanoidRootPart` missing |

`Net::Event("Attack")` must be the **same string** on both sides. Treat that name as public protocol.

## Cooldown storage

`LastAttackAt` is a `NumberValue` on the Player: session-only, no DataStore. Do not persist combat cadence. For anti-exploit that must survive respawn, use DataService `SetTransient` on a path **you** added to the Template — still not a library field.

## No lambdas

`Attack->On(OnAttack)` needs a named function. The first argument of a server `On` is the `Player` who fired.

See [Net](../libraries/net.md) and [Safety](../cpp-safety.md).
