---
title: Ward
---

**Ward** is Cluaupp’s server anti-cheat kernel: remote rate limits, packet-size caps, and movement strikes. It does **not** write [Keep](../keep/) data — economy stays on the server. Flare, Net, Keep replication, and Helm call Ward on every inbound client buffer.

Header: `#include <clpp/libs/ward.clh>`. Runtime: `CluauppLibs.Ward`.

## Why

- **One strike pool.** Flooding Flare and teleporting share the same kick counter (`Ward.KickAt`, default 8).
- **Token bucket per channel.** `Allow(player, "flare", 60, 120)` refills 60 tokens/sec up to a burst of 120. Empty tokens **drop** the request. A strike (`rate:<channel>`) happens only after `Ward.FloodAt` consecutive denials (default 80) — button mash is not a kick.
- **Speed revert.** Heartbeat compares `HumanoidRootPart` distance to `MaxTeleport` and `MaxSpeed`; illegal motion is snapped back, then struck.
- **Spawn is not a hack.** `Start` / `WatchMovement` grace the player for 3 seconds on join and every `CharacterAdded`, and drop `lastPos` when the root is missing. Mostly-vertical falls (horizontal move under `MaxTeleport`) are not struck. Heartbeat speed uses a 1/30 dt floor so a hitch does not look like a teleport.
- **Studio.** `Ward.KickInStudio` defaults to `false`. Strikes still fire; kicks do not, so placeholder playtests are not disconnected. Set `Ward.KickInStudio = true` only when you want to exercise the kick path in Studio.

When **not** to use: client-side “anti-cheat” (the client is not authority), or treating Ward as a replacement for escrow trades — use `Keep.Trade`.

## Example

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/ward.clh>
#include <clpp/libs/keep.clh>

[[server]]
void init() {
	Ward.Start();
}

[[server]]
void afterServerTeleport(Player player) {
	Ward.Grace(player, 2);
}

[[server]]
void onCustomRemote(Player player, buffer packed) {
	if (!Ward.Packet(player, 64)) {
		return;
	}
	if (!Ward.Allow(player, "shop", 8, 16)) {
		return;
	}
}
```

The game template already runs this from `Guard.server.clpp`. Join and respawn are already graced. After a legitimate server teleport (not spawn), still call `Ward.Grace` so the next Heartbeat does not look like a speed hack.

## API

### `Ward.Start`

**Returns:** nothing. Starts movement watching (idempotent).

**When:** Once on the server, typically in a boot/handler script.

```clpp
Ward.Start();
```

### `Ward.WatchMovement`

**Returns:** nothing. Same as `Start` without implying “boot the whole anti-cheat”.

**When:** You already rate-limit remotes yourself and only want speed checks.

```clpp
Ward.WatchMovement();
```

### `Ward.Allow`

**Returns:** `bool` — `true` if the player still has a token for `channel`.

**When:** Before handling any client-origin remote. Overloads: channel only (40/s, burst 80), plus `maxPerSec`, plus `burst`.

```clpp
if (!Ward.Allow(player, "shop", 8, 16)) {
	return;
}
```

### `Ward.Packet`

**Returns:** `bool` — `true` if `bytes` is a finite number in `[0, maxBytes]` (default `Ward.MaxPacketBytes` = 24 KiB).

**When:** Before `buffer` unpack. A failed check strikes `packet`.

```clpp
if (!Ward.Packet(player, 128)) {
	return;
}
```

### `Ward.Strike`

**Returns:** `int` — strike count after this call. Kicks at `Ward.KickAt` (skipped in Studio unless `Ward.KickInStudio` is true).

**When:** Custom detections (impossible inventory, forged ids).

```clpp
int n = Ward.Strike(player, "shop:forged");
```

### `Ward.Grace`

**Returns:** nothing. Ignores movement deltas until `os.clock() + seconds` (default 1.5 if you pass a non-positive number).

**When:** After `PivotTo` / `SetPrimaryPartCFrame` from the server.

```clpp
Ward.Grace(player, 2);
```

### `Ward.Clear`

**Returns:** nothing. Drops the player’s buckets and strikes.

**When:** Rare admin pardon; leave happens automatically.

```clpp
Ward.Clear(player);
```

### `Ward.Strikes`

**Returns:** `int` — current strike count (`0` if unknown).

**When:** Admin HUD / logs.

```clpp
int n = Ward.Strikes(player);
```

## Wired for you

| Library | Channel | What is rejected |
| --- | --- | --- |
| Flare | `flare` / `flare:query` | oversized buffer, server-bound packet ids from the client, decode errors |
| Net | `net:<name>` | non-buffer payload, decode errors |
| Keep replicator | `keep` | anything except a one-shot `ready` handshake ≤ 256 bytes |
| Helm | `helm` | command spam; `Give` amount must be a finite `1…1e9` |

Keep trades are a separate duplication-proof escrow (`Reserve` deducts, `Commit` `SaveWait`s both sides or rolls back). Ward does not credit currency.
