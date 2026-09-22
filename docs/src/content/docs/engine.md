---
title: Roblox API
description: How Cluaupp exposes the Roblox engine to CL++ via the Canonical Registry.
---

# Roblox API

Cluaupp does **not** invent the engine. It **consumes** the official API dump into a Canonical Registry, then projects CL++ headers and an LSP index.

- Official docs: [create.roblox.com](https://create.roblox.com/docs/reference/engine)
- Registry CLI: `cluaupp api inspect Players` · `api search` · `api coverage`
- Handbook: [Roblox reference](../reference/roblox/) · [Architecture](../architecture/roblox-target/)

`#include <clpp/roblox.clh>` is for IntelliSense / bindings. The compiler emits real Luau.

## Datatypes

```clpp
part.Size = Vector3::new(8, 1, 8);
part.Position = Vector3::new(0, 10, 0);
part.CFrame = CFrame::lookAt(Vector3::new(0, 10, 0), Vector3::new(0, 10, -10));
part.Color = Color3::fromRGB(255, 0, 0);
frame.Size = UDim2::fromScale(1, 1);
auto material = Enum.Material.Plastic;
```

```luau
part.Size = Vector3.new(8, 1, 8)
part.Position = Vector3.new(0, 10, 0)
part.CFrame = CFrame.lookAt(Vector3.new(0, 10, 0), Vector3.new(0, 10, -10))
part.Color = Color3.fromRGB(255, 0, 0)
frame.Size = UDim2.fromScale(1, 1)
local material = Enum.Material.Plastic
```

Enums are `Enum.Name.Item`. Services are `GetService<Players>()`. Instances: `new MeshPart()`, `new Folder(parent)`. Networking: [Flare](../libraries/flare/). ThreadSafety metadata: [Parallel safety](../architecture/parallel-safety/).
