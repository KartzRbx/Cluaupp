---
title: Net
---

**Net** wraps buffer-packed `RemoteEvent` and `RemoteFunction` instances under `ReplicatedStorage.CluauppNet`. Names are unique per game; payloads are encoded with an internal codec (not JSON on the wire). Use [Flare](/libraries/flare/) for schema-driven networking; Net is the manual escape hatch.

Header: `#include <clpp/libs/net.clh>`. Runtime: `CluauppLibs.Net`.

## Why

- **Quick ad-hoc remotes** when you do not want a `.flare` schema yet.
- **Typed-ish overloads** in CL++ (`Fire` with zero to three args) without templates inside structs.
- **Server/client guards** — `Fire` / `Invoke` assert on the server; `FireServer` / `InvokeServer` assert on the client.
- **[Ward](/libraries/ward/) on the server** — non-buffer payloads, oversized packets, and decode failures are struck instead of unpacked.

When **not** to use: production gameplay traffic (prefer [Flare](/libraries/flare/) `.flare` schemas — [connection example](/examples/net/)), or when you need unreliable batches and query RPCs.

## Example

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/net.clh>

NetEvent CoinsChanged = Net.Event("CoinsChanged");

[[server]]
void initServer() {
	CoinsChanged.On(func (Player player, int amount) {
		// server received from client
	});
}

[[client]]
void initClient() {
	CoinsChanged.On(func (Player player, int amount) {
		// player is nil on client; amount is decoded
	});
	CoinsChanged.FireServer(50);
}
```

## API

### Net.Event

**Returns:** `NetEvent` handle bound to `ReplicatedStorage.CluauppNet/<name>` (creates the remote on the server).

**When:** Named fire-and-forget messages.

**Example**

```clpp
NetEvent E = Net.Event("MyEvent");
```

### Net.Function

**Returns:** `NetFunction` handle for request/response RPC.

**When:** Client asks server (or server asks client) for a return value.

**Example**

```clpp
NetFunction GetLevel = Net.Function("GetLevel");
```

### NetEvent::Fire

**Returns:** Luau `nil`. Sends encoded args to one client (server only).

**When:** Targeted replication (inventory sync, hit confirmation).

**Example**

```clpp
CoinsChanged.Fire(player, 100); // client receives 100
```

### NetEvent::FireAll

**Returns:** Luau `nil`. Broadcasts to every client (server only).

**When:** Global announcements or shared world state.

**Example**

```clpp
CoinsChanged.FireAll(0); // all clients get 0
```

### NetEvent::FireServer

**Returns:** Luau `nil`. Client → server (client only).

**When:** Player actions that must be validated on the server.

**Example**

```clpp
CoinsChanged.FireServer(25);
```

### NetEvent::On

**Returns:** `RBXScriptConnection` — disconnect to stop listening.

**When:** Handling incoming events. On the server, callback receives `Player` then args; on the client, `Player` is `nil` and args follow.

**Example**

```clpp
CoinsChanged.On(func (Player p, int n) {
	post(n); // decoded value
});
```

### NetFunction::On

**Returns:** Luau `nil`. Registers the invoke handler (replaces prior handler).

**When:** Implementing the authority side of an RPC.

**Example**

```clpp
GetLevel.On(func (Player p) {
	return 7; // encoded back to caller
});
```

### NetFunction::Invoke

**Returns:** `auto` — decoded return value from the client (server only).

**When:** Server needs data from a specific player's client (use sparingly).

**Example**

```clpp
int level = GetLevel.Invoke(player); // 7
```

### NetFunction::InvokeServer

**Returns:** `auto` — decoded return value from the server (client only).

**When:** Client requests authoritative computation.

**Example**

```clpp
int level = GetLevel.InvokeServer(); // 7
```
