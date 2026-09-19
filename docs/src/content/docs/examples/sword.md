---
title: Sword (Touched)
---

Melee that uses a **server** `Touched` on the tool handle. The client can play animations; it must not tell the server how much damage to apply.

Same authority as [combat](/examples/combat/), without a Net remote: while the Tool is equipped, `Touched` runs on the server.

## Config

`src/shared/constants/SwordConfig.clh`

```clpp
#pragma once

const double SWORD_COOLDOWN = 0.35;
const int SWORD_DAMAGE = 18;
```

## Script inside the Tool

Put the source next to the Tool so `script.Parent` is the `Tool`. Use **`.legacy.server.clpp`** so Cluaupp emits a 1:1 Script (no Main/Controller split) that Rojo can parent under `ClassicSword`.

`src/server/tools/Sword.legacy.server.clpp`

```clpp
#include <clpp/roblox.clh>
#include "../../shared/constants/SwordConfig.clh"

Players Players = GetService<Players>();
Tool  tool = script.Parent;

void OnTouched(Instance hit) {
	if (hit == null) {
		return;
	}

	Player attacker = Players.GetPlayerFromCharacter(tool.Parent);
	if (attacker == null) {
		return;
	}

	NumberValue  last = attacker.FindFirstChild("LastSwordAt");
	if (last != null) {
		if (tick() - last.Value < SWORD_COOLDOWN) {
			return;
		}
	}

	Instance model = hit.FindFirstAncestorOfClass("Model");
	if (model == null) {
		return;
	}
	Player victim = Players.GetPlayerFromCharacter(model);
	if (victim == null) {
		return;
	}
	if (victim == attacker) {
		return;
	}

	Humanoid humanoid = model.FindFirstChildOfClass("Humanoid");
	if (humanoid == null) {
		return;
	}
	if (humanoid.Health <= 0) {
		return;
	}

	if (last == null) {
		last = new NumberValue(attacker);
		last.Name = "LastSwordAt";
	}
	last.Value = tick();
	humanoid.TakeDamage(SWORD_DAMAGE);
}

void init() {
	BasePart handle = tool.FindFirstChild("Handle");
	if (handle == null) {
		warn("ClassicSword missing Handle");
		return;
	}
	handle.Touched~>Connect(OnTouched);
}
```

`tool.Parent` is the Character while equipped, `nil` in the backpack — `GetPlayerFromCharacter` then fails and the swing is ignored. That is what you want.

## Why `.legacy`

A tagged `Sword.server.clpp` in `src/server/` becomes a service folder in ServerScriptService. A Tool Script must live **under the Tool**. Legacy keeps one file you can Rojo-map into `ClassicSword`.

## Rules

| Do | Do not |
| --- | --- |
| `TakeDamage(SWORD_DAMAGE)` on the server | `FireServer(damage)` from a LocalScript |
| Skip `victim == attacker` | Damage the owner when the handle clips their own parts |
| Cooldown on the attacker | Trust `Touched` rate (it fires every physics step) |
| `GetPlayerFromCharacter` | Treat every Humanoid as a player if you only want PvP |

Client: a LocalScript in the same Tool can play an AnimationTrack on `Activated`. It still must not replicate a damage number.

For ranged hits (mouse target → remote), use [combat](/examples/combat/).
