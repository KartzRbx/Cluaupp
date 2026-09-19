---
sidebar:
  order: 1
title: Syntax
---

Cluaupp does **not** define the language. Write CL++ 0.3.2 (`.clpp` / `.clp` / `.clh`); `clpp` emits Luau. Course and reference: **[kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/)**. Fences use language id `clpp`.

## Files

| Source | Rojo |
| --- | --- |
| `*.server.clpp` | Script |
| `*.client.clpp` | LocalScript |
| `*.plugin.clpp` | Plugin Script |
| `*.clp` / untagged `.clpp` | ModuleScript |
| `*.clh` | ModuleScript (types / structs) |

`void init()` is the script entry. There is no `int main()`.

## Accessors

This table is law. CL++ does **not** use `->`. There is **no** `:` for tables or properties. Instances are class names: `Player player`, never `Player*`.

| Write | Meaning | Luau |
| --- | --- | --- |
| `player.Name` / `player.Kick()` / `workspace.FindFirstChild("x")` | property **and** instance method | `.` / `:` |
| `age: int` / `player:Kick()` | type **or** protected `pcall` | `:` / `pcall` |
| `task::wait` / `Vector3::new` / `Class::Method` / `signal::Connect` | static, method **definition**, **manual** Connect | `.` / `:` |
| `"hi " .: name` | concat | `..` |
| `signal~>Connect(fn)` / `~>Once` | Sweep Connect / Once (default) | `sweep:Add(..., "Disconnect")` |
| `name.Fire(...)` | fire a signal | `:Fire` |
| `items[0]` / `data["Coins"]` | index **only** | `[key]` |
| `Enum.Material.Plastic` | enum | same |

`.` on an instance method still passes `self` (`player.Kick()` → `player:Kick()`). `player:Kick()` in CL++ is the **pcall** form.

`post` / `warn` / `report` → `print` / `warn` / `error`. `to_string` / `to_number` / `to_bool`. `null` is `nil`. Range-for is `for (T x in list)`.

Anonymous callbacks are `func (params) { }` / `func () { }`. `[]` is indexing only.

## Exclusive CL++ (compiled by `clpp`)

```clpp
guard (player != null) else {
	warn("Invalid player");
	return;
}

match (child) {
	BasePart p => BindPart(p),
	Model m => post("model spawned " .: m.Name),
	_ => warn("ignored instance")
};

observable int wallet = 100;
wallet.OnChange(func (int newValue) {
	post("Coins changed to: " .: newValue);
});

signal<Player, int> OnHit;
OnHit~>Connect(func (Player player, int amount) {
	post(player.Name .: " dmg " .: amount);
});
OnHit.Fire(player, 10);

array<string> names = {"Kartz", "Player1"};
dictionary<string, int> stats = { {"Coins", 100}, {"Gems", 50} };

spawn { task::wait(1); post("ready"); };
parallel { post("desync"); };

async Data FetchData(Player player) {
	return await DataService.Server.WaitFor(player);
}

[[server]]
void SaveData(Player player) { post(player.Name); }

[[client]]
void UpdateUI() { post("ui"); }
```

Inside `Class::Method` only: `@this` → `self`, `@janitor` → `self.janitor`. Not in `void init()`. Details: [`@this`](/language/at-this/).

Fusion HUD uses `Fusion.scoped`, `Fusion.Value`, `Fusion.Computed`, `Fusion.New`. See [`examples/game`](https://github.com/KartzRbx/Cluaupp/tree/main/examples/game).

## What Cluaupp adds after `clpp`

- `require(ClppLibs.X)` → `require(ReplicatedStorage.CluauppLibs.X)`
- `--!strict` from `cluaupp.config.json` / `#pragma strict`
- `out/` layout for Rojo (`init`, `build`, `watch`)
