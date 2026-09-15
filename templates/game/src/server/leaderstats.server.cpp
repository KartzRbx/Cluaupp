#include <cluaupp/roblox.hpp>

void CreateLeaderstats(Player* player) {
	if (player->FindFirstChild("leaderstats") != nullptr) {
		return;
	}

	auto* leaderstats = new Folder(player);
	leaderstats->Name = "leaderstats";

	auto* coins = new IntValue(leaderstats);
	coins->Name = "Coins";
	coins->Value = 0;

	auto* level = new IntValue(leaderstats);
	level->Name = "Level";
	level->Value = 0;
}

void init() {
	auto* players = GetService<Players>();

	for (auto* player : players->GetPlayers()) {
		CreateLeaderstats(player);
	}

	players->PlayerAdded.Connect(CreateLeaderstats);
}
