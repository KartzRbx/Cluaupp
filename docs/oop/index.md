---
title: OOP structure
sidebar_position: 1
---

# OOP structure

The **live site** (not just these markdown files) is GitHub Pages:

- [Learn → OOP structure](https://kartzrbx.github.io/Cluaupp/learn/index.html)
- [Guide → OOP](https://kartzrbx.github.io/Cluaupp/guide/oop.html)
- [Examples](https://kartzrbx.github.io/Cluaupp/guide/examples.html)

Cluaupp does **not** compile custom C++ `class` types yet. “OOP” here is how you **lay out systems** so Studio gets Script / LocalScript / ModuleScript from the filename tag — the same idea as roblox-ts. Flamework-style Start/Stop folders are opt-in (`"architecture": true`).

| Page | What you learn |
| --- | --- |
| [File tags](file-tags.md) | `.server` / `.client` / `.plugin` / `.legacy` / untagged |
| [Services](services.md) | One `.server.cpp` → one `.server.luau` |
| [Modules](modules.md) | Untagged files, structs, named functions as methods |

Planner details: [Architecture](../architecture.md). Folder layout: [Organization](../cpp-organization.md). Full services: [Examples](../examples/index.md).
