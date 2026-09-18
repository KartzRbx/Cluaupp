#pragma once
#include <clpp/roblox.clh>

void ShowcaseFeatures(int coins, Player* playerRef) {
	int n = 100;
	float speed = 16.5;
	string name = "Kartz";
	bool isActive = true;
	func callback = func() {};
	(void)speed;
	(void)isActive;
	(void)callback;

	array<string> names = {"Kartz", "Player1"};
	dictionary<string, int> stats = {
		{"Coins", 100},
		{"Gems", 50}
	};
	(void)names;
	(void)stats;

	if (coins > 50) {
		post("Enough balance!");
	} else if (coins == 0) {
		warn("No coins!");
	} else {
		report("Balance sync error.");
	}

	for (int i = 0; i < 10; i++) {
		post("Count: " .: i);
	}

	n += 1;

	observable int wallet = 100;
	wallet.OnChange(func (int newValue) {
		post("Coins changed to: " .: newValue);
	});

	signal<Player*, int> OnCoinsUpdated;
	OnCoinsUpdated::Connect(func (Player* player, int newAmount) {
		post("New coins for " .: player.Name .: ": " .: newAmount);
	});
	OnCoinsUpdated::Once(func (Player* player, int newAmount) {
		(void)newAmount;
		post("First coins for " .: player.Name);
	});
	OnCoinsUpdated::Fire(playerRef, wallet);

	guard (playerRef != null) else {
		warn("Invalid player");
		return;
	}

	playerRef::GetPropertyChangedSignal("Name")::Connect(func () {
		post("Name changed");
	});

	auto [success, result] = pcall(func () {
		return 1;
	});
	(void)result;

	const int moeda = 4;
	match (moeda) {
		int a => post(a),
		_ => post("Not found")
	};

	if (success) {
		post("Data loaded successfully!");
	}

	spawn {
		task::wait(2);
		post("Delay finished!");
	};

	parallel {
		post("desync");
	};

	match (name) {
		string s => post(s),
		_ => warn("Instance not supported")
	};
}
