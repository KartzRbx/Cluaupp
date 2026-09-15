#include <cluaupp/roblox.hpp>

const int STARTING_COINS = 0;

export void init() {
	const auto* players = GetService<Players>();
	auto* part = new Part(workspace);
	part->Size = Vector3(8, 1, 8);
	part->Position = Vector3(0, 10, 0);
	part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
	part->Color = Color3::fromRGB(255, 0, 0);
	part->Anchored = true;

	auto* frame = new Frame();
	frame->Size = UDim2::fromScale(1, 1);
	frame->Position = UDim2(0, 0, 0.5, 0);
	frame->BackgroundColor3 = Color3(1, 1, 1);

	auto material = Enum::Material::Plastic;
	part->Material = material;
}

