# Cluaupp documentation

The live handbook is **[GitHub Pages](https://kartzrbx.github.io/Cluaupp/docs/)** — every construct the CLI accepts, not an Enum dump.

## Start

1. [Intro](intro.md) — what Cluaupp is
2. [Getting started](getting-started.md) — npm, `init`, Rojo, clangd
3. [CLI](cli.md) — `init`, `build`, `watch`, `lsp`, `intellisense`, flags
4. [Config](config.md) — `cluaupp.config.json`
5. [IntelliSense](intellisense.md) — clangd only

## Language

6. [Syntax](syntax.md) — **complete subset**: files, types, functions, scopes, control, operators, strings, `string_concat`, callbacks, casts, OOP, singletons, unsupported
7. [print and cout](print-cout.md) — logging
8. [C++ types](cpp-types.md) — primitives, Instances, `LuaArray`
9. [const](cpp-const.md) — immutability
10. [Advanced](cpp-advanced.md) — `::` vs `:`, Wally, optimization notes

## Structure

11. [Organization](cpp-organization.md) — server / client / shared, filename tags
12. [Architecture](architecture.md) — one file in, one file out
13. [OOP structure](oop/index.md) — structs, sibling headers, `Class::` methods, singletons
14. [Safety](cpp-safety.md) — client trust, Janitor, Net, DataService

## Roblox

15. [Libraries](libraries/index.md) — DataService, Janitor, Fusion / Iris / UI
16. [Examples](examples/index.md) — leaderstats, combat, shop, HUD
17. [Roblox API](roblox-api.md) — how to spell engine calls (Creator Hub for members)
18. [Comparison](comparison.md) — roblox-ts and WASM

Moonwave (local): `npx moonwave dev`. Site rebuild: `npm run site`.
