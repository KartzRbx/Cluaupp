---
title: C++ types in Cluaupp
sidebar_position: 10
---

# Types

Cluaupp is statically typed in the C++ you write and in the Luau it emits. A type is a contract: what a value is allowed to be, and what you are allowed to do with it.

## Primitive map

| C++ | Luau | Use for |
| --- | --- | --- |
| `int`, `float`, `double` | `number` | counts, damage, alpha |
| `bool` | `boolean` | flags |
| `string` / `const char*` | `string` | names, paths |
| `void` | (no return) | procedures |
| `auto` | inferred | when `new` or `GetService` makes the type obvious |
| `Player*`, `Folder*`, … | `Player`, `Folder` | Instances |
| `LuaArray<int>` / `vector<T>` | `{number}` | arrays (Template inventory, `GetPlayers`) |
| `optional<T>` | `T?` | missing values (prefer `nullptr` on Instances) |
| `Vector3`, `CFrame`, `UDim2` | same | datatypes |

```cpp
int coins = 10;
bool loaded = false;
auto* folder = new Folder(player);
```

```luau
local coins: number = 10
local loaded: boolean = false
local folder: Folder = Instance.new("Folder")
folder.Parent = player
```

## Pointers are Instances, not memory

In Cluaupp, `Player*` does not mean “heap address”. It means “this is a Roblox Instance of class Player”. `->` becomes `.` for properties and `:` for engine/library methods.

```cpp
player->Name = "Kartz";
player->FindFirstChild("leaderstats");
```

```luau
player.Name = "Kartz"
player:FindFirstChild("leaderstats")
```

There is no pointer arithmetic, no `delete`, no `std::unique_ptr`. Lifetime is Roblox’s: parented Instances live until `Destroy` or until a [Janitor](libraries/janitor.md) cleans them.

## `nullptr`

`nullptr` is `nil`. Always test before using a `FindFirstChild` result:

```cpp
auto* stats = player->FindFirstChild("leaderstats");
if (stats == nullptr) {
	return;
}
```

## Why types matter

Typos, wrong arguments, and `nil` indexing are the majority of live-game bugs. `--!strict` plus C++ types catch them in the editor. If a function takes `Player*`, do not pass a `string`. If a value is `const int`, do not assign to it later.

Next: [const and immutability](cpp-const.md).
