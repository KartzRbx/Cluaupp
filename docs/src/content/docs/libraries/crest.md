---
title: Crest
---

**Crest** adds Roblox topbar-style icon buttons that follow `TopbarInset`. Chain fluent setters, bind events, and drive notice badges. Client chrome only — shop logic stays on the server / [Flare](/libraries/flare/).

Header: `#include <clpp/libs/crest.clh>`. Runtime: `CluauppLibs.Crest`.

## Why

**Use when:**

- Settings, shop, or inventory entry from the top bar with correct inset on console/mobile.
- Toggle panels bound with `bindToggleItem` and `select` / `deselect`.

**Do not use when:**

- You need in-world billboards — [Pin](/libraries/pin/).
- You need reactive HUD layout — [Gleam](/libraries/gleam/).

## Example CL++

```clpp
#include <clpp/libs/crest.clh>

void OpenShop() {
	post("open shop");
}

[[client]]
void init() {
	Crest shop = new Crest();
	shop.setName("Shop");
	shop.setLabel("Shop");
	shop.setRight();
	shop.bindEvent("selected", OpenShop);
}
```

## API

### Crest.new_ / `new Crest()`

**Returns:** `Crest` icon controller.

**When:** Each topbar button is its own instance (not a separate Icon type).

```clpp
Crest icon = new Crest();
```

### setName

**Returns:** `Crest` (chainable).

**When:** Stable instance name under the Crest ScreenGui.

### setLabel

**Returns:** `Crest`.

**When:** Text drawn on the icon when no image is set.

### setImage

**Returns:** `Crest`.

**When:** rbxassetid or asset URI for the button face.

### setEnabled

**Returns:** `Crest`.

**When:** Hide or disable interaction without destroying.

### setOrder

**Returns:** `Crest`.

**When:** `LayoutOrder` among icons in the same alignment bucket.

### setWidth

**Returns:** `Crest`.

**When:** Non-square icon width (height stays icon size).

### align

**Returns:** `Crest`.

**When:** `"left"`, `"mid"` / `"center"`, or `"right"` bucket under Crest host.

### setLeft

**Returns:** `Crest` — `align("left")`.

**When:** Default left cluster.

### setMid

**Returns:** `Crest` — center cluster.

**When:** Single prominent action.

### setRight

**Returns:** `Crest` — right cluster.

**When:** Shop / settings on the right (common pattern).

### bindEvent

**Returns:** `Crest`.

**When:** Listen for runtime events such as `"selected"`, `"deselected"`, `"Activated"`, `"toggled"`, `"notified"`, hover events.

```clpp
icon.bindEvent("selected", func () { /* ... */ });
```

### bindToggleItem

**Returns:** `Crest`.

**When:** A `GuiObject` panel shown while this icon is selected.

### notify

**Returns:** `Crest` — shows notice dot.

**When:** Unread mail or pending reward indicator.

### clearNotices

**Returns:** `Crest` — hides notice dot.

**When:** Player opened the related panel.

### select

**Returns:** `Crest` — marks selected, shows bound toggle items, may deselect other auto-deselect icons.

**When:** Programmatic open state.

### deselect

**Returns:** `Crest`.

**When:** Close bound panel without destroying icon.

### Destroy

**Returns:** `void`.

**When:** Remove icon and disconnect from layout.
