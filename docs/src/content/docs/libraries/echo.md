---
title: Echo
---

**Echo** replicates **other players' characters** as **CFrame snapshots** at **20 Hz** (default). The server packs **f32 CFrame buffers** into `UnreliableRemoteEvent` packets; the client interpolates toward the last snapshot and **skips LocalPlayer** by default. Clock uses `workspace:GetServerTimeNow()`.

Header: `#include <clpp/libs/echo.clh>`. Runtime: `CluauppLibs.Echo`.

## Why

- **Not Heartbeat spam on your own remotes.** Default **20 Hz** publish loop; tune with `Echo.Config`.
- **Buffers, not JSON character tables.** `WriteCFrame` / `ReadCFrame` and packed snapshot records (UserId + 48-byte CFrame).
- **Server creates remotes; client `WaitForChild`.** `Stats()` counters update live.

Echo smooths visuals; it does not replace server authority on position validation.

## Example

```clpp
#include <clpp/libs/echo.clh>

void init() {
	Echo.Config(EchoConfig {
		.Rate = 20,
		.Interpolate = 12,
		.MaxDistance = 400,
	});
	Echo.Start();
}
```

On the client, read poses with `Echo.Holder().Get(player)` and tear down with [Sweep](../sweep/) when characters remove.

## API

### `Echo.Start`

**Returns:** nothing (idempotent).

**When:** Once per place — server publishes snapshots on Heartbeat at `Config.Rate`; client listens and interpolates.

```clpp
Echo.Start();
```

### `Echo.Holder`

**Returns:** `EchoHolder` table with `Get` and `All`.

**When:** Read latest replicated pose per player on client or server mirror tables.

```clpp
EchoEntity ent = Echo.Holder().Get(player);
```

### `EchoHolder.Get`

**Returns:** `EchoEntity` — `Player`, `CFrame`, `Clock` (or nil if unknown).

**When:** Drive nametags, shadows, or off-screen proxies for **remote** players.

```clpp
EchoEntity ent = Echo.Holder().Get(player);
```

### `EchoHolder.All`

**Returns:** `EchoEntity` map keyed by `Player` (runtime table of all tracked entities).

**When:** Iterate everyone Echo knows about (debug HUD, batch effects).

```clpp
EchoEntity all = Echo.Holder().All();
```

### `Echo.Entity`

**Returns:** `EchoEntityLib` with `new_(player)`.

**When:** Ensure an entity record exists before snapshots arrive.

```clpp
EchoEntityLib lib = Echo.Entity();
EchoEntity e = lib.new_(player);
```

### `EchoEntityLib.new_`

**Returns:** `EchoEntity` for the given player.

**When:** Same as `ensureEntity` — rarely needed if `Start` and snapshots already run.

```clpp
EchoEntity e = Echo.Entity().new_(player);
```

### `Echo.WriteCFrame`

**Returns:** `buffer` — 48 bytes, twelve `f32` CFrame components.

**When:** Custom packing that must match Echo’s on-wire layout.

```clpp
buffer buf = Echo.WriteCFrame(root.CFrame);
```

### `Echo.ReadCFrame`

**Returns:** `CFrame` from a 48-byte buffer written by `WriteCFrame`.

**When:** Decode a single CFrame payload outside the snapshot packet.

```clpp
CFrame cf = Echo.ReadCFrame(buf);
```

### `Echo.Stats`

**Returns:** `EchoStats` — `Packets`, `PacketsSent`, `PacketsReceived`, `BytesSent`, `BytesReceived`, `Snapshots`.

**When:** Studio overlay or [Lens](../lens/) window for bandwidth tuning.

```clpp
EchoStats s = Echo.Stats();
```

### `Echo.Config`

**Returns:** `EchoConfig` — `Rate`, `Interpolate`, `MaxDistance` (pass a patch table to merge, then returns live config).

**When:** Set publish rate (Hz), client lerp stiffness, and optional cull distance (`0` = no cull).

```clpp
Echo.Config(EchoConfig { .Rate = 20, .Interpolate = 16 });
auto cfg = Echo.Config();
```

### `Echo.ReplicationRules`

**Returns:** `EchoRules` — `SkipLocal` (pass patch to update).

**When:** Default skips local player replication; disable only if you intentionally drive LocalPlayer from Echo.

```clpp
Echo.ReplicationRules(EchoRules { .SkipLocal = true });
```

### `Echo.Events`

**Returns:** `Folder` — `EchoRemotes` under `ReplicatedStorage` (server creates, client waits).

**When:** Advanced wiring next to the snapshot remote.

```clpp
Folder folder = Echo.Events();
```

### `Echo.Snapshots`

**Returns:** `auto` — last `{ CFrame, Clock }` per player (runtime table).

**When:** Debug compare raw snapshot vs interpolated root.

```clpp
auto last = Echo.Snapshots();
```

### `Echo.ServerClock`

**Returns:** `double` — `workspace:GetServerTimeNow()`.

**When:** Align client effects to the same clock stamped on snapshot packets.

```clpp
double t = Echo.ServerClock();
```

### `Echo.Player`

**Returns:** `Player` — `Players.LocalPlayer`.

**When:** Client-only helpers without re-fetching the service.

```clpp
Player me = Echo.Player();
```
