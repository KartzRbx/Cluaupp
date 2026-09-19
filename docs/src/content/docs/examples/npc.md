---
title: NPC
---

Shift + Hive. `.shift` compiles AI to u8 ids. `.hive` bakes Health/Target columns. Flare can snapshot Hive and replicate the Shift id. Sweep Destroy when the model dies.

`src/shared/Npc.shift`:

```
state Idle
state Chase parent Combat
Idle -> Chase when SeePlayer
Chase -> Idle when Lost
```

`src/shared/NpcWorld.hive`:

```
component Health { i32 current, i32 max }
component Target { i32 dummy }
```

```clpp
#include "Npc.clh"
#include "NpcWorld.clh"
#include <clpp/libs/sweep.clh>

void init() {
	HiveWorld world = NpcWorld.New();
	ShiftMachine brain = Npc.New();
	int entity = world.Entity();
	world.Set(entity, NpcWorld.Health, 100);
	brain.ChangeState("Idle");
}
```

RobloxStateMachine used string states and polled `OnDataChanged` every frame. Shift does not. Hive is ECS columns, not a second FSM.

See [Shift](/libraries/shift/) and [Hive](/libraries/hive/).
