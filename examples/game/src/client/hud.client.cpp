#pragma strict
#include <cluaupp/roblox.hpp>

void init() {
	auto* playerGui = GetService<Players>()->LocalPlayer->FindFirstChild("PlayerGui");
	auto* screen = new ScreenGui();
	screen->Name = "Hud";
	auto* coins = new TextLabel();
	coins->Name = "Coins";
	coins->Parent = screen;
	print("hud ready");
}
