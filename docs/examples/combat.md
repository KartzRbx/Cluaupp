---
title: Combat (server validation)
sidebar_position: 4
---

# Combat

Live source: [`examples/game/src/server/combat.server.clpp`](../../examples/game/src/server/combat.server.clpp). Language: [CL++](https://kartzrbx.github.io/CLPP/).

This sample uses exclusive CL++:

- `guard` / `match` instead of nested null checks
- `signal<Player*, int> OnHit` and `OnHit~>Connect` / `OnHit::Fire`
- `observable int combo`
- `[[server]]` on `WatchWorkspace`
- `spawn { task::wait(1); … }`

The client never decides damage. Touched parts fire `OnHit`; the server prints combo and destroys the part.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

struct CombatServer {
	Janitor* janitor;
	signal<Player*, int> OnHit;
	void PlayerEntered(Player* player);
	void BindPart(BasePart* part);
	void WatchWorkspace();
};
```
