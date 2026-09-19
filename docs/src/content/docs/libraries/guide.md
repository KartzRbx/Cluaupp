---
title: Guide
---

**Guide** is onboarding: an ordered list of steps, each with its own [Sweep](/libraries/sweep/). Leaving a step runs `Exit` and destroys that step’s sweep before the next `Enter`. Rewards and persistence still belong on [Keep](/libraries/keep/) on the server.

Header: `#include <clpp/libs/guide.clh>`. Runtime: `CluauppLibs.Guide`.

## Why

- **No leaked highlights or connections.** Each step owns a Sweep; `Advance`, `Back`, `Complete`, and `Destroy` tear the active step down.
- **Optional `Highlight` instance** — engine `Highlight` if you do not pass `GuideConfig.Highlight`.
- **`Guide.Start(steps)` starts the tutorial.** `Guide.Start()` with **no step array** returns the Guide module unchanged (not a session). **`Guide.Start(player)` is not a tutorial API.**

## Example

```clpp
#include <clpp/libs/guide.clh>
#include <clpp/libs/sweep.clh>

void EnterShop(Sweep sweep) {
	post("open shop");
}

void EnterQuest(Sweep sweep) {
	post("quest");
}

void OnDone() {
	post("tutorial done");
}

[[client]]
void init() {
	GuideSession session = Guide.Start(
		{ Guide.Step.new_(EnterShop), Guide.Step.new_(EnterQuest) },
		GuideConfig { .OnComplete = OnDone }
	);
}
```

`Guide.build` returns a session **without** auto-starting; call `session.Start()` or `session.Start(step)` yourself. Replicate progress as u8 over [Flare](/libraries/flare/) if needed.

## API

### `Guide.Step.new_` (function)

**Returns:** `GuideStep` spec — table with `Enter` / `Exit` / `Highlight` or a bare enter function.

**When:** Build the step list passed to `Start` or `build`. Overloads: `new_(enterFn)`, `new_(order, enterFn)`, `new_(order, specTable)`.

```clpp
Guide.Step.new_(EnterShop);
Guide.Step.new_(2, EnterQuest);
```

### `Guide.build`

**Returns:** `GuideSession` — **not** started until you call `session.Start()`.

**When:** You need the session object before choosing when to begin (e.g. after a loading screen).

```clpp
GuideSession session = Guide.build(steps, config);
session.Start();
```

### `Guide.Start`

**Returns:** `GuideSession` when the first argument is a **step array** (starts at step 1). Returns the **Guide module** when called with no steps table (passthrough).

**When:** One-liner client tutorial after UI is ready — pass **steps**, not a `Player`.

```clpp
GuideSession session = Guide.Start(steps, config);
```

### `GuideStep.Enter`

**Returns:** nothing.

**When:** Step table API — run logic when the step becomes active (receives the step’s `Sweep`).

```clpp
step.Enter(sweep);
```

### `GuideStep.Exit`

**Returns:** nothing.

**When:** Custom teardown before the step sweep is destroyed.

```clpp
step.Exit(sweep);
```

### `GuideSession.Start`

**Returns:** nothing.

**When:** Begin the flow at step `1` or at an explicit index (`Start(int step)`).

```clpp
session.Start();
session.Start(3);
```

### `GuideSession.GoTo`

**Returns:** `bool` — false if destroyed, invalid index, or out of range.

**When:** Jump to a specific step (runs exit on the previous step).

```clpp
session.GoTo(2);
```

### `GuideSession.Advance`

**Returns:** `bool` — false if inactive or destroyed; `true` when moving forward or completing on the last step.

**When:** “Next” button — calls `Complete` when there is no following step.

```clpp
session.Advance();
```

### `GuideSession.Back`

**Returns:** `bool` — false if inactive or destroyed.

**When:** “Previous” button within the same session.

```clpp
session.Back();
```

### `GuideSession.Complete`

**Returns:** nothing.

**When:** End the tutorial early; runs `OnComplete` from `GuideConfig`.

```clpp
session.Complete();
```

### `GuideSession.GetStep`

**Returns:** `int` — current step index (0 if not yet started).

**When:** UI step indicator or save slot for progress.

```clpp
int i = session.GetStep();
```

### `GuideSession.IsActive`

**Returns:** `bool` — session started and not destroyed.

**When:** Disable input while a guide is running.

```clpp
if (session.IsActive()) { }
```

### `GuideSession.Destroy`

**Returns:** nothing.

**When:** Player leaves or skips forever — completes then marks destroyed.

```clpp
session.Destroy();
```
