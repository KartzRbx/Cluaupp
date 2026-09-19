---
title: Roblox API
---

Cluaupp uses the official engine. Spell the call in CL++ 0.3.2 / 0.3.3; look up members on [create.roblox.com](https://create.roblox.com/docs/reference/engine). `#include <clpp/generated/instances.clh>` lists **flattened** members: `MeshPart` has `Size`, `CFrame`, `FindFirstChild`, and `WaitForChild`, plus `new MeshPart()`.

Handbook: **[Docs](https://kartzrbx.github.io/Cluaupp/docs/)** · [Roblox in Cluaupp](https://kartzrbx.github.io/Cluaupp/docs/engine.html)

`#include <clpp/roblox.clh>` is IntelliSense. The compiler ignores the header and emits real Luau.

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

Every enum is `Enum.Name.Item`. Services are `GetService<Players>()`. Instances are `new MeshPart()`, `new Folder(parent)`, and `mesh.FindFirstChild("x")`. Binary payloads use Luau `buffer` (`buffer::create`, `buffer::writeu32`, `buffer::readf64`). Networking: write a `.flare` schema and include the generated `Net.clh` — see [Flare](/libraries/flare/).
