---
title: Helm
---

**Helm** is typed admin commands. A `.helm` file is the schema; the server packs args into **buffers** (u8 count, then tagged number / string / bool / player UserId) and checks **permission on the server** before the callback runs. The Gleam console is only a client view of `HelmSession.Run`.

Header: `#include <clpp/libs/helm.clh>`. Runtime: `CluauppLibs.Helm`. Generated `out/` is `--!native` with u8 command ids.

## Why

- **Args are buffers, not JSON.** UserId tags unpack to `Player` on the server.
- **Permission is enforced server-side** (`Admin` attribute, `Permission` / `Helm`, `HelmRank`, or place creator). `Kick` calls `:Kick()`. `Give` fires hooks — wire economy through [Keep](../keep/) yourself. Amounts outside `1…1e9` are ignored.
- **[Ward](../ward/) rate-limits `Run`** (`helm`, 6/s) so a stolen console cannot flood `Give` / `Kick`.
- **Do not treat a Lens UI as the only authority for `Give`.** Always run through `Run` on the server.

## Schema (`Admin.helm`)

```
opt name = Admin
command Give(Player target, i32 amount) permission Admin
command Kick(Player target, string reason) permission Admin
```

## Example

```clpp
#include "Admin.clh"
#include <clpp/libs/helm.clh>

void OnGive(Player player, Player target, int amount) {
	post(target.Name);
}

void init() {
	Helm.RegisterHook("Give", OnGive);
	Helm.RegisterDefaultCommands();
	HelmSession session = Admin.Open(player);
	session.Run("Give", target, 50);
}
```

## API

### `Helm.RegisterDefaultCommands`

**Returns:** nothing.

**When:** Boot once on the server so built-in `Give` and `Kick` exist in the registry (Admin permission, typed args).

```clpp
Helm.RegisterDefaultCommands();
```

### `Helm.RegisterHook`

**Returns:** nothing.

**When:** Extend or override behavior without replacing the whole command — e.g. implement `Give` economy, or block runs via a `BeforeRun` hook (runtime convention).

```clpp
Helm.RegisterHook("Give", OnGive);
Helm.RegisterHook("BeforeRun", OnBeforeRun);
```

### `Helm.RegisterType`

**Returns:** nothing.

**When:** Teach Helm how to coerce a schema type name (custom `Transform` / `Parse` on the type definition table).

```clpp
Helm.RegisterType("Player", helmTypeDef);
```

### `Helm.RegisterCommand`

**Returns:** nothing.

**When:** Register or merge a single `HelmCommand` (name, permission, callback) at runtime without a `.helm` file.

```clpp
Helm.RegisterCommand(HelmCommand {
	.Name = "Heal",
	.Permission = "Mod",
	.Callback = OnHeal,
});
```

### `Helm.Registry`

**Returns:** `HelmRegistry` — live command name → definition table (includes merged schema from `Register` / generated `Open`).

**When:** Introspection, tests, or custom dispatch that still calls `Run` with packed args.

```clpp
auto reg = Helm.Registry();
```

### `Helm.Dispatcher`

**Returns:** `HelmDispatcher` — dispatch handle tied to the current registry (see runtime `CluauppLibs.Helm`).

**When:** Shared entry point when you do not want to keep a `HelmSession` per caller; prefer `HelmSession.Run` when you already have `Open(player)`.

```clpp
HelmDispatcher d = Helm.Dispatcher();
```

### `Helm.Give`

**Returns:** `bool` — whether the command ran (permission + hooks + callback).

**When:** Shortcut for `Open(player):Run("Give", target, amount)` after default commands are registered.

```clpp
bool ok = Helm.Give(admin, target, 100);
```

### `Helm.Kick`

**Returns:** `bool` — whether the command ran.

**When:** Shortcut for kicking through Helm permission checks (not a raw `:Kick()` from client code).

```clpp
bool ok = Helm.Kick(admin, target, "Exploiting");
```

### `Helm.Open`

**Returns:** `HelmSession` bound to `player` (and registers the schema table when generated `Admin.Open` is used).

**When:** Every command execution path — console, admin UI, or server script — should go through a session so permission and packing stay consistent.

```clpp
HelmSession session = Helm.Open(player);
```

### `HelmSession.Run`

**Returns:** `bool` — success (`false` for unknown command, failed permission, or blocked hook).

**When:** Execute a registered command by name with 0–3 typed arguments (matches generated overloads).

```clpp
session.Run("Kick", target, "AFK");
session.Run("Give", target, 50);
```
