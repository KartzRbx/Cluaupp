---
title: Flare
---

**Flare** is Cluaupp’s network kernel: Zap-tight packing, batched reliable/unreliable remotes, and query RPC. You do not hand-wire remotes — write `src/shared/Net.flare`, run `cluaupp build`, and use the generated `Net.clh` / `Net.luau` API (`Net.Hit.FireServer`, `Net.GetCoins.Invoke()`, …). This header exposes the low-level `Flare.write*` / `Flare.read*` helpers and `Flare.open` used by generated code.

Header: `#include <clpp/libs/flare.clh>`. Runtime: `CluauppLibs.Flare`.

## Why

- **Schema-first networking** with typed packets and queries instead of ad-hoc [Net](/libraries/net/) tables.
- **Binary buffers** on the hot path (QuickNet-style cursors, instance sidecar arrays).
- **Inbound client packets are gated by [Ward](/libraries/ward/)** — size cap, token bucket, and `from Client` direction. Forged server-origin ids are struck, not dispatched.
- **Kernel only in games** — gameplay calls generated `Net.*`; custom codecs in advanced pipelines call `Flare.write*` / `read*`.

When **not** to use: trivial one-off remotes (Net), or declaring packets in CL++ without a `.flare` file (generation owns the game API).

## Example

`.flare` (build generates `Net`):

```
packet Hit(Player target, i32 damage) from Client
query GetCoins() -> i32
```

```clpp
#include <clpp/roblox.clh>
// #include <generated/Net.clh> after build

[[client]]
void attack(Player target) {
	// Net.Hit.FireServer(target, 25);
}

[[client]]
void showCoins() {
	// int coins = Net.GetCoins.Invoke(); // 100 if server returns 100
}
```

Manual cursor (kernel):

```clpp
#include <clpp/libs/flare.clh>

void pack() {
	FlareCursor c = Flare.cursor();
	Flare.writeu16(c, 42);
	int n = Flare.readu16(c); // must use a fresh cursor on encoded buf in real code
}
```

## API

### Flare.cursor

**Returns:** `FlareCursor` — empty write buffer (default capacity 64).

**When:** Building a payload byte-by-byte in generated or custom codecs.

**Example**

```clpp
FlareCursor c = Flare.cursor();
```

### Flare.cursor (size)

**Returns:** `FlareCursor` — buffer with initial capacity `size`.

**When:** Known payload size to reduce reallocations.

**Example**

```clpp
FlareCursor c = Flare.cursor(256);
```

### Flare.open

**Returns:** `FlareSession` — registers packets/queries against remotes under `host`.

**When:** Generated `Net.luau` startup (not typical game CL++).

**Example**

```clpp
FlareSession session = Flare.open(netModule);
```

### FlareSession::packet

**Returns:** `auto` — packet API object (generated spec: id, reliability, write/read fns).

**When:** Registering a fire-and-forget packet definition.

**Example**

```clpp
session.packet(spec); // spec built by codegen
```

### FlareSession::query

**Returns:** `auto` — query API object (`Invoke` client-side, `On` server-side).

**When:** Registering request/response RPC.

**Example**

```clpp
session.query(spec);
```

### Flare.writeu8

**Returns:** Luau `nil`. Writes unsigned 8-bit integer at cursor offset (grows buffer as needed).

**When:** Packed enums or small counters.

**Example**

```clpp
Flare.writeu8(c, 255);
```

### Flare.writeu16

**Returns:** Luau `nil`. Writes unsigned 16-bit integer (little-endian).

**When:** Length prefixes, ids.

**Example**

```clpp
Flare.writeu16(c, 1000);
```

### Flare.writeu32

**Returns:** Luau `nil`. Writes unsigned 32-bit integer.

**When:** Timestamps, large ids.

**Example**

```clpp
Flare.writeu32(c, 1);
```

### Flare.writei8

**Returns:** Luau `nil`. Writes signed 8-bit integer.

**When:** Small signed deltas.

**Example**

```clpp
Flare.writei8(c, -1);
```

### Flare.writei16

**Returns:** Luau `nil`. Writes signed 16-bit integer.

**When:** Coordinates or scores in ±32k range.

**Example**

```clpp
Flare.writei16(c, -500);
```

### Flare.writei32

**Returns:** Luau `nil`. Writes signed 32-bit integer.

**When:** `.flare` `i32` fields.

**Example**

```clpp
Flare.writei32(c, 25); // damage in Hit packet
```

### Flare.writef32

**Returns:** Luau `nil`. Writes IEEE float32.

**When:** Compact vectors and normals.

**Example**

```clpp
Flare.writef32(c, 3.14);
```

### Flare.writef64

**Returns:** Luau `nil`. Writes IEEE float64.

**When:** Full-precision numbers in custom payloads.

**Example**

```clpp
Flare.writef64(c, 1.0);
```

### Flare.writebool

**Returns:** Luau `nil`. Writes boolean as a single byte.

**When:** Flags in binary protocols.

**Example**

```clpp
Flare.writebool(c, true);
```

### Flare.writestring

**Returns:** Luau `nil`. Writes length-prefixed string (u16 length + bytes).

**When:** Names, chat, ids.

**Example**

```clpp
Flare.writestring(c, "hi");
```

### Flare.writeVector3

**Returns:** Luau `nil`. Writes three float32 components.

**When:** Positions and directions in packets.

**Example**

```clpp
Flare.writeVector3(c, Vector3.new(0, 10, 0));
```

### Flare.writeVector2

**Returns:** Luau `nil`. Writes two float32 components.

**When:** UI or 2D math on the wire.

**Example**

```clpp
Flare.writeVector2(c, Vector2.new(1, 0));
```

### Flare.writeCFrame

**Returns:** Luau `nil`. Writes CFrame as 12 float32 components (runtime layout).

**When:** Replication of full transforms.

**Example**

```clpp
Flare.writeCFrame(c, part.CFrame);
```

### Flare.writeColor3

**Returns:** Luau `nil`. Writes Color3 in packed form used by Flare.

**When:** Tint or team color fields.

**Example**

```clpp
Flare.writeColor3(c, Color3.new(1, 0, 0));
```

### Flare.writeUDim

**Returns:** Luau `nil`. Writes scale + offset for `UDim`.

**When:** UI schema fields.

**Example**

```clpp
Flare.writeUDim(c, UDim.new(0.5, 0));
```

### Flare.writeUDim2

**Returns:** Luau `nil`. Writes two `UDim` components.

**When:** UI size/position in `.flare`.

**Example**

```clpp
Flare.writeUDim2(c, UDim2.new(1, 0, 1, 0));
```

### Flare.writeBrickColor

**Returns:** Luau `nil`. Writes `BrickColor` id.

**When:** Legacy color fields.

**Example**

```clpp
Flare.writeBrickColor(c, BrickColor.Red());
```

### Flare.writebuffer

**Returns:** Luau `nil`. Writes nested buffer with length prefix.

**When:** Opaque blobs alongside structured fields.

**Example**

```clpp
Flare.writebuffer(c, myBuf);
```

### Flare.writeInstance

**Returns:** Luau `nil`. Appends instance to cursor sidecar and writes reference index.

**When:** Passing parts, tools, or characters (instances ride parallel to the buffer).

**Example**

```clpp
Flare.writeInstance(c, part);
```

### Flare.readu8

**Returns:** `int` — unsigned byte at cursor (advances offset).

**When:** Decoding generated packet bodies.

**Example**

```clpp
int b = Flare.readu8(c); // 255 if that was written
```

### Flare.readu16

**Returns:** `int` — unsigned 16-bit value.

**When:** Reading length or id fields.

**Example**

```clpp
int n = Flare.readu16(c); // 1000
```

### Flare.readu32

**Returns:** `int` — unsigned 32-bit value.

**When:** Large counters.

**Example**

```clpp
int n = Flare.readu32(c);
```

### Flare.readi8

**Returns:** `int` — signed 8-bit value.

**When:** Small signed fields.

**Example**

```clpp
int n = Flare.readi8(c); // -1
```

### Flare.readi16

**Returns:** `int` — signed 16-bit value.

**When:** `.flare` `i16` fields.

**Example**

```clpp
int n = Flare.readi16(c);
```

### Flare.readi32

**Returns:** `int` — signed 32-bit value.

**When:** `.flare` `i32` fields such as coin counts.

**Example**

```clpp
int coins = Flare.readi32(c); // 100
```

### Flare.readf32

**Returns:** `double` — float32 decoded to Luau number.

**When:** Vector components.

**Example**

```clpp
double x = Flare.readf32(c);
```

### Flare.readf64

**Returns:** `double` — float64 value.

**When:** High-precision custom data.

**Example**

```clpp
double v = Flare.readf64(c); // 1.0
```

### Flare.readbool

**Returns:** `bool` — boolean from one byte.

**When:** Flag decoding.

**Example**

```clpp
bool ok = Flare.readbool(c); // true
```

### Flare.readstring

**Returns:** `string` — length-prefixed string.

**When:** Text fields in packets.

**Example**

```clpp
string s = Flare.readstring(c); // "hi"
```

### Flare.readVector3

**Returns:** `Vector3`.

**When:** World-space replication.

**Example**

```clpp
Vector3 p = Flare.readVector3(c);
```

### Flare.readVector2

**Returns:** `Vector2`.

**When:** 2D data.

**Example**

```clpp
Vector2 v = Flare.readVector2(c);
```

### Flare.readCFrame

**Returns:** `CFrame`.

**When:** Transform replication.

**Example**

```clpp
CFrame cf = Flare.readCFrame(c);
```

### Flare.readColor3

**Returns:** `Color3`.

**When:** Color fields.

**Example**

```clpp
Color3 col = Flare.readColor3(c);
```

### Flare.readUDim

**Returns:** `UDim`.

**When:** UI decoding.

**Example**

```clpp
UDim d = Flare.readUDim(c);
```

### Flare.readUDim2

**Returns:** `UDim2`.

**When:** UI size/position decode.

**Example**

```clpp
UDim2 d2 = Flare.readUDim2(c);
```

### Flare.readBrickColor

**Returns:** `BrickColor`.

**When:** Legacy color decode.

**Example**

```clpp
BrickColor bc = Flare.readBrickColor(c);
```

### Flare.readbuffer

**Returns:** `buffer` — nested buffer slice.

**When:** Opaque attachment fields.

**Example**

```clpp
buffer b = Flare.readbuffer(c);
```

### Flare.readInstance

**Returns:** `Instance` — next instance from the cursor sidecar (may be `nil` if absent).

**When:** Resolving written instance references.

**Example**

```clpp
Instance inst = Flare.readInstance(c); // same part that was written
```
