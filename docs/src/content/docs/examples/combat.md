---
title: Combat (server validation)
---

Live source: see the game examples under `examples/game/` in the [Cluaupp repo](https://github.com/KartzRbx/Cluaupp). Language: [CL++](https://kartzrbx.github.io/CLPP/).

This sample uses exclusive CL++:

- `guard` / `match` instead of nested null checks
- `signal<Player, int> OnHit` and `OnHit~>Connect` / `OnHit.Fire`
- `observable int combo`
- `[[server]]` on `WatchWorkspace`
- `spawn { task::wait(1); … }`

The client never decides damage. Touched parts fire `OnHit`; the server prints combo and destroys the part.

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/sweep.clh>

struct CombatServer {
	Janitor janitor;
	signal<Player, int> OnHit;
	void PlayerEntered(Player player);
	void BindPart(BasePart part);
	void WatchWorkspace();
};
```
