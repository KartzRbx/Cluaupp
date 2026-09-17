#pragma strict
#include <cluaupp/roblox.hpp>

void ApplyDamage(Player* player, int amount) {
	auto* character = player->Character;
	if (character == nullptr) {
		return;
	}
	auto* humanoid = character->FindFirstChildOfClass("Humanoid");
	if (humanoid == nullptr) {
		return;
	}
	humanoid->TakeDamage(amount);
}

void OnPlayer(Player* player) {
	ApplyDamage(player, 0);
}

void init() {
	auto* players = GetService<Players>();
	players->PlayerAdded.Connect(OnPlayer);
}
