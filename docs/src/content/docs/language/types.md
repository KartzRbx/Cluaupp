---
title: Types
description: Primitive map, Instances, Option/Result, and why types matter — CL++ 0.8+.
---

CL++ is statically typed. `clpp` emits Luau with the same contracts. A type is what a value is allowed to be, and what you may do with it.

Language law tracks **CL++ 0.8+**. Course: [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

## Primitive map

| CL++ | Luau | Use for |
| --- | --- | --- |
| `int`, `float`, `double` | `number` | counts, damage, alpha |
| `bool` | `boolean` | flags |
| `string` | `string` | names, paths |
| `void` | (no return) | procedures |
| `auto` | inferred | when `new` or `GetService` makes the type obvious |
| `Player`, `Folder`, … | `Player`, `Folder` | Instances (class names, never `Player*`) |
| `LuaArray<int>` / `array<T>` / `vector<T>` | `{number}` | arrays (`GetPlayers`, inventory) |
| `optional<T>` / `Option<T>` | `T?` | absence (`Some` / `None`) |
| `Result<T, E>` | tagged `{ ok }` / `{ err }` | recoverable errors (`Ok` / `Err` / `?`) |
| `Vector3`, `CFrame`, `UDim2` | same | datatypes |

```clpp
int coins = 10;
bool loaded = false;
Folder folder = new Folder(player);
optional<int> maybe = Some(1);
Result<int, string> parsed = Ok(42);
```

```luau
local coins: number = 10
local loaded: boolean = false
local folder: Folder = Instance.new("Folder")
folder.Parent = player
local maybe: number? = 1
local parsed = { ok = 42 }
```

Full Option/Result guide: [Option and Result](../option-result/).

## Instances are class names

Write `Player player`, not `Player*`. There is no `->`, no address-of, no pointer arithmetic. Properties and instance methods use `.`.

```clpp
player.Name = "Kartz";
player.FindFirstChild("leaderstats");
```

```luau
player.Name = "Kartz"
player:FindFirstChild("leaderstats")
```

Lifetime is Roblox’s: parented Instances live until `Destroy` or until a [Sweep](../../libraries/sweep/) cleans them.

## `null`

`null` is `nil`. Always test before using a `FindFirstChild` result:

```clpp
auto stats = player.FindFirstChild("leaderstats");
if (stats == null) {
	return;
}
```

## Assigning Result

Assigning a `Result` to a plain `T` is **CLPP0202**. Unwrap with `match` or `?`:

```clpp
int n = parse(s)?;           // ok
Result<int, string> r = Ok(1);
// int bad = r;              // CLPP0202
```

## Why types matter

Typos, wrong arguments, and `nil` indexing are the majority of live-game bugs. `--!strict` plus CL++ types catch them in the editor. If a function takes `Player`, do not pass a `string`. If a value is `const int`, do not assign to it later.

Next: [Option and Result](../option-result/) · [const and immutability](../const/).
