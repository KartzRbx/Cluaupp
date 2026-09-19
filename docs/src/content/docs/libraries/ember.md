---
title: Ember
---

**Ember** runs client VFX templates: particles, beams, trails, sounds, fire/smoke, animations. Sweep owns lifetimes — no Debris. Gameplay hits stay on [Flare](/libraries/flare/); Ember is cosmetic.

Header: `#include <clpp/libs/ember.clh>`. Runtime: `CluauppLibs.Ember`.

## Why

**Use when:**

- One-shot bursts, attached muzzle flashes, or scaled effect templates.
- You want `DestroyAfter` tied to Sweep when the character is removed.

**Do not use when:**

- Validating hits or damage — server / Flare.
- Long-lived systems without a destroy plan — always pair with `DestroyAfter` or manual cleanup.

## Example CL++

```clpp
#include <clpp/libs/ember.clh>

Instance template = /* ReplicatedStorage VFX */;

void OnHit(Instance character) {
	Instance fx = Ember.Attach(template, character, "RootAttachment");
	Ember.Emit(fx, 12);
	Ember.DestroyAfter(fx, 2);
}

[[client]]
void init() {
	Ember.Play(muzzleFlash);
}
```

## API

### Ember.Emit

**Returns:** `void`.

**When:** Burst particles, play one-shot sounds, enable beams/trails briefly.

```clpp
Ember.Emit(root); // default count 8 on emitters
```

### Ember.Emit (count)

**Returns:** `void`.

**When:** Explicit particle count per emitter under `root`.

### Ember.Play

**Returns:** `void` — enables looping emitters/beams/trails; plays sounds and animation tracks.

**When:** Sustained effect until `Stop` or `DestroyAfter`.

### Ember.Stop

**Returns:** `void` — disables emitters, stops sounds and tracks.

**When:** Cut effect early before destroy delay.

### Ember.CloneOnto

**Returns:** `Instance` — cloned template parented on attachment/part/model.

**When:** Manual placement before `Emit` / `Play`.

```clpp
Instance clone = Ember.CloneOnto(template, part);
```

### Ember.Attach

**Returns:** `Instance` — clone welded to character; Sweep links to character lifetime; calls `Play`.

**When:** Hit sparks, footstep FX on rig.

### Ember.Attach (attachmentName)

**Returns:** `Instance`.

**When:** Named attachment under character instead of HumanoidRootPart.

### Ember.Scale

**Returns:** `void` — scales particle sizes/speeds, beam width, trail width, fire/smoke size, sound playback speed.

**When:** Charge level or upgrade tier visual only.

```clpp
Ember.Scale(fx, 1.5);
```

### Ember.DestroyAfter

**Returns:** `void` — schedules stop then Sweep destroy.

**When:** Always pair one-shots so instances do not leak.

```clpp
Ember.DestroyAfter(fx, 2); // seconds
```

### Ember.DestroyAfter (lifetime)

**Returns:** `void` — default lifetime `1` when omitted in runtime.

**When:** Short muzzle flash vs longer smoke.

### Ember.Burst

**Returns:** `Instance` — clone, emit, destroy pipeline.

**When:** Single call for impact FX.

```clpp
Ember.Burst(template, parent); // default count + lifetime
```

### Ember.Burst (count)

**Returns:** `Instance`.

**When:** Heavier burst.

### Ember.Burst (count, lifetime)

**Returns:** `Instance`.

**When:** Full one-shot control.
