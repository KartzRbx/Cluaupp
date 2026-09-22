---
title: Roster
---

**Roster** is a table utility with a Bomb-Click-style API plus tagged-buffer `Pack` / `Unpack` (no JSON on the hot path). Instance methods mutate or view the wrapped table; static `Roster::X(auto data, …)` overloads run the same logic on raw tables. Pack tags: Nil=0, Bool=1, Number=2, String=3, Table=4, Array=5, Vector3=6, CFrame=7, Color3=8.

Header: `#include <clpp/libs/roster.clh>`. Runtime: `CluauppLibs.Roster`.

## Why

- **Array/dictionary helpers** (`Map`, `Filter`, `GroupBy`, …) without copying Luau idioms everywhere.
- **Binary snapshots** for replication or caches ([Keep](../keep/) uses similar buffer growth patterns).
- **Chaining** — many methods return a new `Roster` wrapper.

When **not** to use: deeply nested data that must stay JSON-compatible for external APIs, or when [Flare](../flare/) already defines your wire format.

## Example

```clpp
#include <clpp/libs/roster.clh>

void demo() {
	Roster r = new Roster();
	r.Push(1);
	r.Push(2);
	Roster doubled = r.Map(func (int v, auto i) {
		return v * 2;
	});
	buffer buf = doubled.Pack();
	auto back = Roster.Unpack(buf); // array-like { 2, 4 }
}
```

## API — instance

### new Roster

**Returns:** `Roster` — wrapper around an empty array table `{}`, or around `initial` if you pass a table.

**When:** Starting a fluent chain. CL++ uses the `new` keyword; it emits Luau `Roster.new`. (`New` is only the header name because `new` is a keyword.)

**Example**

```clpp
Roster r = new Roster();
Roster keyed = new Roster({});
keyed.Set(player, true);
if (keyed.Has(player)) {
	keyed.Remove(player);
}
```

### Roster::Size

**Returns:** `int` — number of key/value pairs (not `#` for sparse tables).

**When:** Dictionary cardinality.

**Example**

```clpp
int n = r.Set("a", 1).Size(); // 1
```

### Roster::Length

**Returns:** `int` — `#data` (array length).

**When:** Sequential arrays.

**Example**

```clpp
r.Push(1);
int len = r.Length(); // 1
```

### Roster::IsEmpty

**Returns:** `bool` — `true` when the table has no entries.

**When:** Early-out before work.

**Example**

```clpp
bool empty = r.IsEmpty(); // true on New()
```

### Roster::GetData

**Returns:** `auto` — underlying Luau table (mutable).

**When:** Interop with non-Roster code.

**Example**

```clpp
auto t = r.GetData();
```

### Roster::At

**Returns:** `auto` — value at `index` (negative indices count from end).

**When:** Array access without raw `[]`.

**Example**

```clpp
r.Push("x");
auto v = r.At(1); // "x"
```

### Roster::Find

**Returns:** `int` — first index where `value` equals, or Luau `nil` if missing.

**When:** Linear search in **arrays**. Dictionary membership is `Has(key)`, not `Find`.

**Example**

```clpp
r.Push(10);
int i = r.Find(10); // 1
```

### Roster::Find (value, initPos)

**Returns:** `int` or `nil` — search from `initPos`.

**When:** Continuing a search.

**Example**

```clpp
int i = r.Find(10, 2);
```

### Roster::Find (value, initPos, maxPos)

**Returns:** `int` or `nil` — search within `[initPos, maxPos]`.

**When:** Bounded scans.

**Example**

```clpp
int i = r.Find(10, 1, 5);
```

### Roster::Includes

**Returns:** `bool` — `true` if `Find` would succeed.

**When:** Membership tests.

**Example**

```clpp
bool has = r.Includes(10); // false on empty
```

### Roster::Add

**Returns:** `int` — new array length after appending values.

**When:** Append one or more array elements.

**Example**

```clpp
int len = r.Add(1, 2); // 2
```

### Roster::Push

**Returns:** `int` — same as `Add` (alias).

**When:** Stack-style append.

**Example**

```clpp
r.Push(3); // len 1 on empty roster
```

### Roster::Pop

**Returns:** `auto` — removed last element, or `nil` if empty.

**When:** Stack pop.

**Example**

```clpp
r.Push(1);
auto v = r.Pop(); // 1
```

### Roster::Shift

**Returns:** `auto` — removed first element.

**When:** Queue dequeue.

**Example**

```clpp
r.Push(1);
auto v = r.Shift(); // 1
```

### Roster::Unshift

**Returns:** `int` — length after prepending values.

**When:** Queue enqueue at front.

**Example**

```clpp
r.Unshift(0); // inserts at front
```

### Roster::RemoveAt

**Returns:** `auto` — value removed at `index`.

**When:** Delete by position.

**Example**

```clpp
r.Push(1);
r.RemoveAt(1);
```

### Roster::Remove

**Returns:** `Roster` — same wrapper after deleting `key` (`data[key] = nil`).

**When:** Dictionary keys (players, ids). Extra arguments are ignored.

**Example**

```clpp
r.Set(player, true);
r.Remove(player);
```

### Roster::Map

**Returns:** `Roster` — new table with mapper applied per entry.

**When:** Transform lists or dictionaries.

**Example**

```clpp
Roster m = r.Map(func (int v, auto k) { return v + 1; });
```

### Roster::Filter

**Returns:** `Roster` — array of entries passing `predicate`.

**When:** Subset selection.

**Example**

```clpp
Roster f = r.Filter(func (int v, auto k) { return v > 0; });
```

### Roster::Reduce

**Returns:** `auto` — accumulator after folding.

**When:** Sum, merge, or custom aggregation.

**Example**

```clpp
int sum = r.Reduce(func (int acc, int v, auto i) { return acc + v; }, 0); // 0 on empty
```

### Roster::Some

**Returns:** `bool` — `true` if any entry matches.

**When:** Existential checks.

**Example**

```clpp
bool any = r.Some(func (int v, auto k) { return v == 1; });
```

### Roster::Every

**Returns:** `bool` — `true` if all entries match.

**When:** Validation.

**Example**

```clpp
bool all = r.Every(func (int v, auto k) { return v > 0; });
```

### Roster::ForEach

**Returns:** Luau `nil`. Runs `callback` for each entry.

**When:** Side effects without building a new roster.

**Example**

```clpp
r.ForEach(func (int v, auto k) { post(v); });
```

### Roster::Reverse

**Returns:** `Roster` — new array with reversed order.

**When:** Display or stack reversal.

**Example**

```clpp
Roster rev = r.Reverse();
```

### Roster::Clear

**Returns:** `Roster` — same wrapper with emptied table.

**When:** Reset in place.

**Example**

```clpp
r.Clear();
```

### Roster::Clone

**Returns:** `Roster` — shallow copy.

**When:** Duplicate top-level table.

**Example**

```clpp
Roster c = r.Clone();
```

### Roster::DeepClone

**Returns:** `Roster` — recursive copy of tables.

**When:** Independent nested structures.

**Example**

```clpp
Roster d = r.DeepClone();
```

### Roster::Keys

**Returns:** `Roster` — array of keys.

**When:** Iteration order for dictionaries.

**Example**

```clpp
Roster ks = r.Keys();
```

### Roster::Values

**Returns:** `Roster` — array of values.

**When:** Value-only passes.

**Example**

```clpp
Roster vs = r.Values();
```

### Roster::Set

**Returns:** `Roster` — `this` after `data[key] = value`.

**When:** Dictionary write chaining.

**Example**

```clpp
r.Set("coins", 5);
```

### Roster::Get

**Returns:** `auto` — `data[key]` or `nil`.

**When:** Dictionary read.

**Example**

```clpp
auto v = r.Get("coins");
```

### Roster::Get (key, defaultValue)

**Returns:** `auto` — value or `defaultValue` when missing.

**When:** Fallback reads.

**Example**

```clpp
int c = r.Get("coins", 0); // 0 if absent
```

### Roster::Has

**Returns:** `bool` — `true` if key exists.

**When:** Presence without nil ambiguity.

**Example**

```clpp
bool ok = r.Has("coins");
```

### Roster::Concat

**Returns:** `Roster` — array concatenation with another roster.

**When:** Merging sequences.

**Example**

```clpp
Roster both = a.Concat(b);
```

### Roster::Concat (other)

**Returns:** `Roster` — concat with raw table/array.

**When:** Interop tables.

**Example**

```clpp
Roster both = a.Concat(otherTable);
```

### Roster::Slice

**Returns:** `Roster` — sub-array from `start` to end.

**When:** Pagination or windows.

**Example**

```clpp
Roster sub = r.Slice(2);
```

### Roster::Slice (start, finish)

**Returns:** `Roster` — inclusive slice.

**When:** Bounded copy.

**Example**

```clpp
Roster sub = r.Slice(1, 3);
```

### Roster::Unique

**Returns:** `Roster` — first-seen uniqueness (array).

**When:** Deduping lists.

**Example**

```clpp
Roster u = r.Unique();
```

### Roster::Sort

**Returns:** `Roster` — sorted array (default comparator).

**When:** Ordered display.

**Example**

```clpp
Roster s = r.Sort();
```

### Roster::Sort (comparator)

**Returns:** `Roster` — sorted with `func(a, b) -> bool`.

**When:** Custom ordering.

**Example**

```clpp
Roster s = r.Sort(func (int a, int b) { return a < b; });
```

### Roster::Shuffle

**Returns:** `Roster` — randomly permuted array.

**When:** Loot order, cosmetic variety.

**Example**

```clpp
Roster s = r.Shuffle();
```

### Roster::IndexBy (mapper)

**Returns:** `Roster` — dictionary keyed by `mapper(value, index)`.

**When:** Lookup tables from arrays.

**Example**

```clpp
Roster byId = rows.IndexBy(func (auto row, auto i) { return row.Id; });
```

### Roster::IndexBy (key)

**Returns:** `Roster` — dictionary keyed by `row[key]`.

**When:** Struct-like rows with string field.

**Example**

```clpp
Roster byId = rows.IndexBy("Id");
```

### Roster::GroupBy (mapper)

**Returns:** `Roster` — nested tables grouped by key.

**When:** Bucketing.

**Example**

```clpp
Roster groups = rows.GroupBy(func (auto row, auto i) { return row.Team; });
```

### Roster::GroupBy (key)

**Returns:** `Roster` — groups by `row[key]`.

**When:** Field-based grouping.

**Example**

```clpp
Roster groups = rows.GroupBy("Team");
```

### Roster::Merge

**Returns:** `Roster` — shallow merge with another roster (later keys win).

**When:** Combining dictionaries.

**Example**

```clpp
Roster m = a.Merge(b);
```

### Roster::Merge (other)

**Returns:** `Roster` — merge with raw table.

**When:** Interop merge.

**Example**

```clpp
Roster m = a.Merge(extra);
```

### Roster::Assign

**Returns:** `Roster` — copies keys from other into self.

**When:** In-place style assign via new wrapper.

**Example**

```clpp
Roster out = a.Assign(b);
```

### Roster::Assign (other)

**Returns:** `Roster` — assign from raw table.

**When:** Patch from plain table.

**Example**

```clpp
a.Assign(patch);
```

### Roster::Flatten

**Returns:** `Roster` — one-level flatten of nested arrays.

**When:** Simple nesting removal.

**Example**

```clpp
Roster flat = nested.Flatten();
```

### Roster::Flatten (depth)

**Returns:** `Roster` — flatten up to `depth`.

**When:** Controlled nesting.

**Example**

```clpp
Roster flat = nested.Flatten(2);
```

### Roster::Pack

**Returns:** `buffer` — tagged binary encoding of wrapped data.

**When:** Replication, save snapshots, [Keep](../keep/)-style buffers.

**Example**

```clpp
buffer buf = r.Pack();
```

## API — static (raw table first argument)

Static methods mirror the instance API: pass the table as the first `auto data` argument. Returns and semantics match the instance form unless noted.

### Roster::Size (data)

**Returns:** `int`. **When:** Key count on a raw table. **Example:** `int n = Roster.Size(t);`

### Roster::Length (data)

**Returns:** `int`. **When:** `#t`. **Example:** `int n = Roster.Length(t);`

### Roster::IsEmpty (data)

**Returns:** `bool`. **When:** Raw empty check. **Example:** `bool e = Roster.IsEmpty(t);`

### Roster::At (data, index)

**Returns:** `auto`. **When:** Indexed read. **Example:** `auto v = Roster.At(t, 1);`

### Roster::Find (data, value)

**Returns:** `int` or `nil`. **When:** Search raw array. **Example:** `int i = Roster.Find(t, 1);`

### Roster::Find (data, value, initPos)

**Returns:** `int` or `nil`. **When:** Bounded start. **Example:** `Roster.Find(t, 1, 2);`

### Roster::Find (data, value, initPos, maxPos)

**Returns:** `int` or `nil`. **When:** Full bounded search. **Example:** `Roster.Find(t, 1, 1, 5);`

### Roster::Includes (data, value)

**Returns:** `bool`. **When:** Membership on raw table. **Example:** `Roster.Includes(t, 1);`

### Roster::Add (data, value)

**Returns:** `int` new length. **When:** Mutate raw array. **Example:** `Roster.Add(t, 1);`

### Roster::Push (data, value)

**Returns:** `int`. **When:** Alias of `Add`. **Example:** `Roster.Push(t, 1);`

### Roster::Pop (data)

**Returns:** `auto`. **When:** Pop raw array. **Example:** `Roster.Pop(t);`

### Roster::Shift (data)

**Returns:** `auto`. **When:** Shift raw array. **Example:** `Roster.Shift(t);`

### Roster::Unshift (data, value)

**Returns:** `int`. **When:** Prepend on raw array. **Example:** `Roster.Unshift(t, 0);`

### Roster::RemoveAt (data, index)

**Returns:** `auto`. **When:** Remove index on raw array. **Example:** `Roster.RemoveAt(t, 1);`

### Roster::Map (data, mapper)

**Returns:** `Roster`. **When:** Map without wrapper. **Example:** `Roster.Map(t, func (auto v, auto k) { return v; });`

### Roster::Filter (data, predicate)

**Returns:** `Roster`. **When:** Filter raw table. **Example:** `Roster.Filter(t, func (auto v, auto k) { return true; });`

### Roster::Reduce (data, reducer, initial)

**Returns:** `auto`. **When:** Fold raw table. **Example:** `Roster.Reduce(t, func (auto a, auto v, auto k) { return a; }, 0);`

### Roster::Some (data, predicate)

**Returns:** `bool`. **Example:** `Roster.Some(t, func (auto v, auto k) { return true; });`

### Roster::Every (data, predicate)

**Returns:** `bool`. **Example:** `Roster.Every(t, func (auto v, auto k) { return true; });`

### Roster::ForEach (data, callback)

**Returns:** Luau `nil`. **Example:** `Roster.ForEach(t, func (auto v, auto k) {});`

### Roster::Reverse (data)

**Returns:** `Roster`. **Example:** `Roster.Reverse(t);`

### Roster::Clear (data)

**Returns:** `Roster`. **Example:** `Roster.Clear(t);`

### Roster::Clone (data)

**Returns:** `Roster`. **Example:** `Roster.Clone(t);`

### Roster::DeepClone (data)

**Returns:** `Roster`. **Example:** `Roster.DeepClone(t);`

### Roster::Keys (data)

**Returns:** `Roster`. **Example:** `Roster.Keys(t);`

### Roster::Values (data)

**Returns:** `Roster`. **Example:** `Roster.Values(t);`

### Roster::Set (data, key, value)

**Returns:** `Roster`. **Example:** `Roster.Set(t, "k", 1);`

### Roster::Get (data, key)

**Returns:** `auto`. **Example:** `Roster.Get(t, "k");`

### Roster::Has (data, key)

**Returns:** `bool`. **Example:** `Roster.Has(t, "k");`

### Roster::Concat (data, other)

**Returns:** `Roster`. **Example:** `Roster.Concat(t, other);`

### Roster::Slice (data, start)

**Returns:** `Roster`. **Example:** `Roster.Slice(t, 1);`

### Roster::Slice (data, start, finish)

**Returns:** `Roster`. **Example:** `Roster.Slice(t, 1, 3);`

### Roster::Unique (data)

**Returns:** `Roster`. **Example:** `Roster.Unique(t);`

### Roster::Sort (data)

**Returns:** `Roster`. **Example:** `Roster.Sort(t);`

### Roster::Sort (data, comparator)

**Returns:** `Roster`. **Example:** `Roster.Sort(t, func (auto a, auto b) { return a < b; });`

### Roster::Shuffle (data)

**Returns:** `Roster`. **Example:** `Roster.Shuffle(t);`

### Roster::IndexBy (data, mapper)

**Returns:** `Roster`. **Example:** `Roster.IndexBy(t, func (auto v, auto k) { return k; });`

### Roster::IndexBy (data, key)

**Returns:** `Roster`. **Example:** `Roster.IndexBy(t, "Id");`

### Roster::GroupBy (data, mapper)

**Returns:** `Roster`. **Example:** `Roster.GroupBy(t, func (auto v, auto k) { return k; });`

### Roster::GroupBy (data, key)

**Returns:** `Roster`. **Example:** `Roster.GroupBy(t, "Team");`

### Roster::Merge (data, other)

**Returns:** `Roster`. **Example:** `Roster.Merge(t, other);`

### Roster::Assign (data, other)

**Returns:** `Roster`. **Example:** `Roster.Assign(t, other);`

### Roster::Flatten (data)

**Returns:** `Roster`. **Example:** `Roster.Flatten(t);`

### Roster::Flatten (data, depth)

**Returns:** `Roster`. **Example:** `Roster.Flatten(t, 2);`

### Roster::Pack (value)

**Returns:** `buffer` — encode any serializable value (same codec as instance `Pack`).

**When:** One-shot encode without a wrapper.

**Example**

```clpp
buffer buf = Roster.Pack(myTable);
```

### Roster::Unpack

**Returns:** `auto` — Luau value decoded from `buf`.

**When:** Restoring packed state.

**Example**

```clpp
auto t = Roster.Unpack(buf);
```

### Roster::WriteF64

**Returns:** `buffer` — packed array of float64 (codec-specific layout).

**When:** Numeric bulk columns.

**Example**

```clpp
buffer b = Roster.WriteF64({ 1.0, 2.0 });
```

### Roster::ReadF64

**Returns:** `LuaArray<double>` — decoded floats.

**When:** Reading `WriteF64` output.

**Example**

```clpp
LuaArray<double> xs = Roster.ReadF64(b);
```

### Roster::WriteI32

**Returns:** `buffer` — packed int32 array.

**When:** Integer bulk columns.

**Example**

```clpp
buffer b = Roster.WriteI32({ 1, 2, 3 });
```

### Roster::ReadI32

**Returns:** `LuaArray<int>`.

**When:** Decode `WriteI32`.

**Example**

```clpp
LuaArray<int> xs = Roster.ReadI32(b);
```

### Roster::WriteString

**Returns:** `buffer` — packed string array.

**When:** Bulk string columns.

**Example**

```clpp
buffer b = Roster.WriteString({ "a", "b" });
```

### Roster::ReadString

**Returns:** `LuaArray<string>`.

**When:** Decode `WriteString`.

**Example**

```clpp
LuaArray<string> ss = Roster.ReadString(b);
```
