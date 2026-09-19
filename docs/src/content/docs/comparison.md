---
title: Comparison
---

## vs roblox-ts

[roblox-ts](https://roblox-ts.com/) transpiles TypeScript → Luau. Cluaupp does the same job for **[CL++](https://kartzrbx.github.io/CLPP/)**: one familiar syntax, readable Luau, Roblox APIs as in Studio.

`*.server.clpp` → Script, `*.client.clpp` → LocalScript, untagged → ModuleScript.

## vs C++ → WASM

Cluaupp never compiles native C++ or WASM. The language compiler is `clpp` (Rust). This package is init / Rojo / CluauppLibs.

## When to use what

| Goal | Tool |
| --- | --- |
| Game in TypeScript | roblox-ts |
| Game in CL++ | **Cluaupp** + [`clpp`](https://github.com/KartzRbx/CLPP) |
| Language reference | [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/) |
