#pragma once

// nightcycle/display — pretty-print any Luau value (Rust Display-style).
// Vendored into CluauppLibs.Display with nightcycle/option bundled.
namespace Display {
	auto builder();
	string display(auto value);
}
