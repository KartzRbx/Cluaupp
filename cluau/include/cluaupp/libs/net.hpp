#pragma once

// Buffer-packed RemoteEvent / RemoteFunction. Names are unique per game.
class NetEvent {
public:
	void Fire(Player* player);
	void Fire(Player* player, auto a);
	void Fire(Player* player, auto a, auto b);
	void Fire(Player* player, auto a, auto b, auto c);
	void FireAll();
	void FireAll(auto a);
	void FireAll(auto a, auto b);
	void FireServer();
	void FireServer(auto a);
	void FireServer(auto a, auto b);
	void On(void (*callback)());
};

class NetFunction {
public:
	void On(void (*callback)());
	auto Invoke(Player* player);
	auto Invoke(Player* player, auto a);
	auto InvokeServer();
	auto InvokeServer(auto a);
};

namespace Net {
	NetEvent* Event(string name);
	NetFunction* Function(string name);
}
