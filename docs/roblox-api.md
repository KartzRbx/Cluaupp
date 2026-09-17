# Roblox API

Cluaupp uses the official engine. Spell the call in C++; look up members on [create.roblox.com](https://create.roblox.com/docs/reference/engine). The GitHub Pages site is a **language handbook**, not a dump of every Enum item.

Handbook: **[Docs](https://kartzrbx.github.io/Cluaupp/docs/)** · [Roblox in Cluaupp](https://kartzrbx.github.io/Cluaupp/docs/engine.html)

`#include <cluaupp/roblox.hpp>` is IntelliSense. The compiler ignores the header and emits real Luau.

## Datatypes

```cpp
part->Size = Vector3(8, 1, 8);
part->Position = Vector3(0, 10, 0);
part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
part->Color = Color3::fromRGB(255, 0, 0);
frame->Size = UDim2::fromScale(1, 1);
auto material = Enum::Material::Plastic;
```

```luau
part.Size = Vector3.new(8, 1, 8)
part.Position = Vector3.new(0, 10, 0)
part.CFrame = CFrame.lookAt(Vector3.new(0, 10, 0), Vector3.new(0, 10, -10))
part.Color = Color3.fromRGB(255, 0, 0)
frame.Size = UDim2.fromScale(1, 1)
local material = Enum.Material.Plastic
```

Every enum is `Enum::Name::Item` → `Enum.Name.Item`. Services are `GetService<Players>()`. Instances are `new Folder(parent)` and `player->FindFirstChild("x")`.
