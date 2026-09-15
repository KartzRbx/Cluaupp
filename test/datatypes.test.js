"use strict";

const { compileSource } = require("../src/compile");

const source = `
#include <cluaupp/roblox.hpp>

const int STARTING_COINS = 0;

void init() {
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
`;



const luau = compileSource(source, "datatypes.cpp", { strict: true });
const checks = [
	"Vector3.new(8, 1, 8)",
	"Vector3.new(0, 10, 0)",
	"CFrame.lookAt",
	"Vector3.new(0, 10, -10)",
	"Color3.fromRGB(255, 0, 0)",
	'Instance.new("Part")',
	"part.Parent = workspace",
	"UDim2.fromScale(1, 1)",
	"UDim2.new(0, 0, 0.5, 0)",
	"Color3.new(1, 1, 1)",
	"Enum.Material.Plastic",
	'Instance.new("Frame")',
	"const STARTING_COINS: number = 0",
	"const players: Players = game:GetService(\"Players\")",
];

const missing = checks.filter((piece) => !luau.includes(piece));
if (missing.length > 0) {
	console.error("Cluaupp datatypes test failed. Missing:");
	for (const piece of missing) {
		console.error(" -", piece);
	}
	console.error("\nOutput:\n" + luau);
	process.exit(1);
}

console.log("Cluaupp datatypes ok");
console.log(luau);
