---
title: Connection (Flare)
---

The client fires **Ready**. The server waits for Keep, then **Welcome**. A **Session** query is RPC for identity. Keep’s tagged `ready` buffer is a different channel — do not replace it with this packet.

Schema: `src/ReplicatedStorage/Shared/Net/Net.flare`. After `cluaupp build`, include the generated `Net.clh` (not `<clpp/libs/net.clh>`). Library: [Flare](../../libraries/flare/).

```
opt name = Net

packet Ready() from Client
packet Welcome(i32 userId, f64 clock) from Server
query Session() -> i32
```

| Line | Direction | What the game calls |
| --- | --- | --- |
| `Ready` | client → server | `Net.Ready.FireServer()` / `Net.Ready~>Connect` |
| `Welcome` | server → client | `Net.Welcome.Fire(player, …)` / `Net.Welcome~>Connect` |
| `Session` | RPC | `Net.Session.Invoke()` / `Net.Session.On` |

`from Client` handlers on the server always receive `Player` first. `query` `On` must **return** the result.

`from Server` `Fire` is `Fire(recipient, …fields)`. The first argument is **who receives the packet**, not a schema field. `Welcome` is `(i32 userId, f64 clock)`, so the call is `Fire(player, player.UserId, tick())` — `player` = target, `player.UserId` = `userId`. The client `Connect` only sees `userId` and `clock`.

## Server

`src/ServerScriptService/Handlers/Connection.server.clpp`

```clpp
#pragma strict
#include <clpp/roblox.clh>
#include "../../ReplicatedStorage/Shared/Net/Net.clh"
#include <clpp/libs/keep.clh>
#include <clpp/libs/ward.clh>

void init() {
	Net.Ready~>Connect(func (Player player) {
		Ward.Grace(player, 2);
		Keep.Server.WaitFor(player);
		Net.Welcome.Fire(player, player.UserId, tick()); // recipient, i32 userId, f64 clock
	});
	Net.Session.On(func (Player player) {
		return player.UserId;
	});
}
```

`DataBoot` still calls `Keep.Server.Init` once. This script only `WaitFor`.

## Client

`src/StarterPlayer/StarterPlayerScripts/Controllers/Connection.client.clpp`

```clpp
#pragma strict
#include <clpp/roblox.clh>
#include "../../../ReplicatedStorage/Shared/Net/Net.clh"
#include <clpp/libs/keep.clh>

void init() {
	Keep.Client.Init();
	Net.Welcome~>Connect(func (int userId, double clock) {
		post(userId);
	});
	Net.Ready.FireServer();
	int me = Net.Session.Invoke();
}
```

Fire `Ready` after `Keep.Client.Init()` so the replica exists before gameplay packets land.

## Do not

- Do not declare remotes by hand (`Instance.new("RemoteEvent")`) — Flare owns the session.
- Do not send Keep currency or inventory on this channel. Write those with `Keep.Server` only.
- Do not skip [Ward](../../libraries/ward/) `Grace` after a server teleport.
