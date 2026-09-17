# Why Cluaupp

## vs roblox-ts

[roblox-ts](https://roblox-ts.com/) transpiles TypeScript → Luau. Cluaupp is the same idea for C++: one language merge, readable output, quality Roblox APIs.

Both are source-to-source. Neither goes through WASM. Generated Luau calls the Roblox API directly.

By default Cluaupp matches that filename key: `*.server.cpp` → one Script, `*.client.cpp` → one LocalScript, untagged → ModuleScript. The ForeverHD folder split is opt-in (`"architecture": true`). See [Architecture](architecture.md).

Current Luau has [`local`, `const`, and `--!strict`](https://luau.org/getting-started). Cluaupp emits `const` from C++ `const`. `--!strict` is opt-in (`#pragma strict` or `"strict": true`).

## vs C++ → WASM → Luau (RBX-CPP / Emscripten)

Compiling real C++ to WASM and translating the binary to Luau works, but the cost shows up in the API:

- Roblox methods become generic calls (`lua_call`, blobs)
- `GetPlayers()` and `FindFirstChild()` do not come out as they do in Studio
- Heavy toolchain: Emscripten, CMake, Python, tens of GB of cache

Cluaupp skips that path. You write *script* C++ (the same mental subset as roblox-ts) and the compiler emits readable Luau.

```cpp
players->GetPlayers()
player->FindFirstChild("leaderstats")
GetService<Players>()
```

is exactly what Studio expects, not a parallel runtime.

## When to use what

| Goal | Tool |
| --- | --- |
| Game in TypeScript | roblox-ts |
| Game in C++, clear Roblox API | **Cluaupp** |
| Full native C++ (templates, STL, engines) | not Cluaupp today |
