# Roblox API

Cluaupp covers the engine API listed on [create.roblox.com](https://create.roblox.com/docs/reference/engine): **925 classes**, **636 enums**, and the datatypes (`Vector3`, `CFrame`, `UDim`, `UDim2`, …).

The **page-by-page** reference (every property, method, and event, with C++ and Luau) lives on the generated site:

**[Cluaupp docs (GitHub Pages)](https://kartzrbx.github.io/Cluaupp/)**

- [Datatypes](https://kartzrbx.github.io/Cluaupp/api/datatypes/)
- [Classes](https://kartzrbx.github.io/Cluaupp/api/classes/)
- [Enums](https://kartzrbx.github.io/Cluaupp/api/enums/)

In C++, `#include <cluaupp/roblox.hpp>`. The compiler ignores the header and emits real Luau.

## Datatypes

```cpp
part->Size = Vector3(8, 1, 8);
part->Position = Vector3(0, 10, 0);
part->CFrame = CFrame::lookAt(Vector3(0, 10, 0), Vector3(0, 10, -10));
part->Color = Color3::fromRGB(255, 0, 0);
frame->Size = UDim2::fromScale(1, 1);
frame->Position = UDim2(0, 0, 0.5, 0);
auto material = Enum::Material::Plastic;
```

```luau
part.Size = Vector3.new(8, 1, 8)
part.Position = Vector3.new(0, 10, 0)
part.CFrame = CFrame.lookAt(Vector3.new(0, 10, 0), Vector3.new(0, 10, -10))
part.Color = Color3.fromRGB(255, 0, 0)
frame.Size = UDim2.fromScale(1, 1)
frame.Position = UDim2.new(0, 0, 0.5, 0)
local material = Enum.Material.Plastic
```

| C++ | Luau |
| --- | --- |
| `Vector3(x, y, z)` | `Vector3.new(x, y, z)` |
| `Vector2(x, y)` | `Vector2.new(x, y)` |
| `CFrame(x, y, z)` | `CFrame.new(x, y, z)` |
| `CFrame::lookAt(from, look)` | `CFrame.lookAt(from, look)` |
| `UDim(scale, offset)` | `UDim.new(scale, offset)` |
| `UDim2(xs, xo, ys, yo)` | `UDim2.new(xs, xo, ys, yo)` |
| `UDim2::fromScale(x, y)` | `UDim2.fromScale(x, y)` |
| `UDim2::fromOffset(x, y)` | `UDim2.fromOffset(x, y)` |
| `Color3::fromRGB(r, g, b)` | `Color3.fromRGB(r, g, b)` |
| `Color3::fromHSV(h, s, v)` | `Color3.fromHSV(h, s, v)` |
| `BrickColor("Bright red")` | `BrickColor.new("Bright red")` |
| `Enum::Material::Plastic` | `Enum.Material.Plastic` |
| `Rect(x0, y0, x1, y1)` | `Rect.new(x0, y0, x1, y1)` |
| `Ray(origin, direction)` | `Ray.new(origin, direction)` |
| `NumberRange(min, max)` | `NumberRange.new(min, max)` |
| `TweenInfo(time, style)` | `TweenInfo.new(time, style)` |

## Instances and services

```cpp
auto* part = new Part(workspace);
auto* players = GetService<Players>();
player->FindFirstChild("leaderstats");
players->GetPlayers();
```

```luau
local part: Part = Instance.new("Part")
part.Parent = workspace
local players: Players = game:GetService("Players")
player:FindFirstChild("leaderstats")
players:GetPlayers()
```

`new Class(parent)` is for creatable classes (`Instance.new`). Services use `GetService<Name>()`.

Generated headers (official client dump):

- `include/cluaupp/datatypes.hpp`
- `include/cluaupp/generated/enums.hpp`
- `include/cluaupp/generated/instances.hpp`

To regenerate: `npm run generate-api` in the `cluau/` folder.
