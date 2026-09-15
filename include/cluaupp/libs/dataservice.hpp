#pragma once

// KartzRbx/dataservicev2 — ProfileStore + QuickNet + typed path tokens.
// Full source is CluauppLibs.DataService (Server / Client / Data / Path).
class DataService {
public:
	static DataService* Get();
	static DataService* Server();
	static DataService* Client();
	auto Paths;
	auto Get(Player* player, string path);
	auto GetPersisted(Player* player, string path);
	void Set(Player* player, string path, auto value);
	void SetTransient(Player* player, string path, auto value);
	void UpdateTransient(Player* player, string path, auto value);
	void ClearTransient(Player* player, string path);
	auto GetOrderedList(Player* player, string path);
	auto GetOrderedListWithPriority(Player* player, string path);
	auto WaitFor(Player* player);
	RBXScriptConnection Observe(Player* player, string path, void (*callback)());
};
