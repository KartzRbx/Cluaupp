---
sidebar:
  order: 1
title: Syntax
description: Accessors, control flow, Option/Result, and what Cluaupp adds after clpp — CL++ 0.8+.
---

Cluaupp does **not** define the language. Write CL++ **0.8+** (`.clpp` / `.clp` / `.clh`); `clpp` emits Luau. Course and reference: **[kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/)**. Fences use language id `clpp`.

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
| `expr?` | Result try (early-return on `err`) | IIFE unwrap |

`.` on an instance method still passes `self` (`player.Kick()` → `player:Kick()`). `player:Kick()` in CL++ is the **pcall** form.

`post` / `warn` / `report` → `print` / `warn` / `error`. `to_string` / `to_number` / `to_bool`. `null` is `nil`. Range-for is `for (T x in list)`.

Anonymous callbacks are `func (params) { }` / `func () { }`. `[]` is indexing only.

## Expression precedence (critical)

```text
assign
  → try (?)          # Result only — not optional chaining
    → colon (:)      # Roblox obj:method
      → ternary      # c ? t : e
        → coalesce   # ??
          → … arithmetic / unary …
```

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

Result<int, string> parse(string s) {
	if (s == "") {
		return Err("empty");
	}
	return Ok(to_number(s));
}

int use(string s) {
	int n = parse(s)?;
	return n + 1;
}

match (parse("10")) {
	Ok v => { post(v); },
	Err e => { warn(e); },
}

import { Wallet } from "./PlayerData.clh";

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

Inside `Class::Method` only: `@this` → `self`, `@janitor` → `self.janitor`. Not in `void init()`. Details: [`@this`](../at-this/).

Option/Result details: [Option and Result](../option-result/). Modules: [Modules](../modules/).

## What Cluaupp adds after `clpp`

- `require(ClppLibs.X)` → `require(ReplicatedStorage.CluauppLibs.X)`
- `--!strict` from `cluaupp.config.json` / `#pragma strict`
- `out/` layout for Rojo (`init`, `build`, `watch`)
- `local __janitor = Janitor.new()` inside `Class:Method` → `self.janitor` (once). If the Connect target is an Instance parameter, `LinkToInstance` that instance instead.
- Compile artifact hooks: `nativeHints` / `layoutHints` → [Optimizer](../../architecture/optimizer/) and [Cluaupp host](../../architecture/cluaupp-host/)
