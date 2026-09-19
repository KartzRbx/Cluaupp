---
title: Keep
---

**Keep** is Cluaupp player data: ProfileStore session locking, tagged replication buffers, path tokens, transient overlays, ordered lists, and trade escrow. Server code uses `Keep.Server`; clients use `Keep.Client`. Low-level DataStore access uses `Keep.Store`; player-to-player trades use `Keep.Trade`. Paths are generated into `Keep.Paths` / `Keep.Server.Paths` from your template.

Header: `#include <clpp/libs/keep.clh>`. Runtime: `CluauppLibs.Keep`.

## Why

- **Session-safe saves** with mock mode, key prefixes, and buffer stats for tuning replication.
- **Merged reads** (`Get`) vs persisted-only (`GetPersisted`) vs session-only transient layers.
- **Signals** per path for UI ([Gleam](/libraries/gleam/)) and gameplay without polling.

When **not** to use: global non-player state (use `Keep.Store` directly or a custom store), or cross-place inventory without understanding ProfileStore limits.

## Example

```clpp
#include <clpp/roblox.clh>
#include <clpp/libs/keep.clh>

[[server]]
void initServer() {
	Keep.Server.Init(DataServiceOptions {
		.Template = myDefaultData,
		.StoreName = "PlayerData_v1",
	});
	Data data = Keep.Server.WaitFor(player);
	data.Set(Keep.Server.Paths.Currencies.Coins, 100);
}

[[client]]
void initClient() {
	Keep.Client.Init();
	Data data = Keep.Client.WaitForData();
	int coins = data.Get(Keep.Client.Paths.Currencies.Coins); // replicated value
}
```

## API — Keep (statics)

### Keep.Server

**Returns:** `DataServiceServer` — server-only API (`Init`, `WaitFor`, `Get`, …). Unavailable stubs on client builds.

**When:** Authoritative data in `[[server]]` scripts.

**Example**

```clpp
Keep.Server.Init(opts);
```

### Keep.Client

**Returns:** `DataServiceClient` — client API (`Init`, `WaitForData`, `Get`, …).

**When:** Local player data mirror in `[[client]]` scripts.

**Example**

```clpp
Keep.Client.Init();
```

### Keep.Paths

**Returns:** `DataPath` tree — path tokens for the active context (server or client compile).

**When:** Typed `Get` / `Set` without string paths.

**Example**

```clpp
DataPath p = Keep.Paths.Currencies.Coins;
```

### Keep.Enum

**Returns:** `DataServiceEnum` — e.g. `Keep.Enum.OrderList.Asc` / `Desc` for ordered lists.

**When:** `GetOrderedList` options.

**Example**

```clpp
string asc = Keep.Enum.OrderList.Asc;
```

### Keep.Store

**Returns:** `KeepStore` module — ProfileStore-style `StartSessionAsync`, globals, messaging.

**When:** Non-player keys, tooling, or custom session logic.

**Example**

```clpp
KeepStore store = KeepStore.New("Meta", tmpl);
```

### Keep.Trade

**Returns:** `KeepTrade` — escrow `Begin` / `Reserve` / `Commit` / `Abort` / `SendOffline`. `Reserve` deducts into a per-trade vault; `Commit` credits with receipts and `SaveWait`s both profiles (rollback if either save fails).

**When:** Atomic trades between two loaded profiles.

**Example**

```clpp
string id = Keep.Trade.Begin(profileA, profileB);
```

## API — DataServiceServer

### DataServiceServer.Paths

**Returns:** `DataPath` tree for the server template.

**When:** Same as `Keep.Server.Paths` after `Init`.

**Example**

```clpp
DataPath coins = Keep.Server.Paths.Currencies.Coins;
```

### DataServiceServer::Init

**Returns:** `DataServiceServer` — `this` after starting replication and store binding.

**When:** Once per server experience with `DataServiceOptions`.

**Example**

```clpp
Keep.Server.Init(DataServiceOptions { .Template = tmpl, .StoreName = "v1" });
```

### DataServiceServer::WaitFor

**Returns:** `Data` — blocks until the player’s profile is loaded and replicated.

**When:** Join handlers that must not race empty data.

**Example**

```clpp
Data data = Keep.Server.WaitFor(player);
```

### DataServiceServer::Get

**Returns:** `Data` or Luau `nil` if no session.

**When:** Non-yielding lookup after you know data exists.

**Example**

```clpp
Data data = Keep.Server.Get(player);
```

### DataServiceServer::HasData

**Returns:** `bool` — `true` when a live `Data` object exists for the player.

**When:** Guards before `Get`.

**Example**

```clpp
bool ok = Keep.Server.HasData(player);
```

### DataServiceServer::GetProfile

**Returns:** `DataProfile` — underlying store profile (save, release, trade APIs).

**When:** `Keep.Trade` or direct `Profile:Save()`.

**Example**

```clpp
DataProfile profile = Keep.Server.GetProfile(player);
```

### DataServiceServer::GetBufferStats

**Returns:** `DataBufferStats` — aggregate replication metrics.

**When:** Server-wide bandwidth tuning.

**Example**

```clpp
DataBufferStats s = Keep.Server.GetBufferStats();
```

### DataServiceServer::GetBufferStats (player)

**Returns:** `DataBufferStats` — per-player replication metrics.

**When:** Diagnosing one heavy client.

**Example**

```clpp
DataBufferStats s = Keep.Server.GetBufferStats(player);
```

### DataServiceServer::Destroy

**Returns:** Luau `nil`. Tears down the server data service.

**When:** Test shutdown or place cleanup.

**Example**

```clpp
Keep.Server.Destroy();
```

## API — DataServiceClient

### DataServiceClient.Paths

**Returns:** `DataPath` tree for the client template.

**When:** Client `Get` / signals.

**Example**

```clpp
auto path = Keep.Client.Paths.Currencies.Coins;
```

### DataServiceClient::Init

**Returns:** `Data` — local player data facade after starting client replication.

**When:** Once in client bootstrap (often before `WaitForData`).

**Example**

```clpp
Data data = Keep.Client.Init();
```

### DataServiceClient::WaitForData

**Returns:** `Data` — yields until the first full snapshot arrives.

**When:** HUD and input that need non-nil paths.

**Example**

```clpp
Data data = Keep.Client.WaitForData();
```

### DataServiceClient::Get

**Returns:** `Data` or `nil` if not ready.

**When:** Polling without yield.

**Example**

```clpp
Data data = Keep.Client.Get();
```

### DataServiceClient::GetBufferStats

**Returns:** `DataBufferStats` — client receive stats.

**When:** Debugging replication volume locally.

**Example**

```clpp
DataBufferStats s = Keep.Client.GetBufferStats();
```

### DataServiceClient::Destroy

**Returns:** Luau `nil`. Stops client data service.

**When:** Teardown.

**Example**

```clpp
Keep.Client.Destroy();
```

## API — Data

### Data.Changed

**Returns:** `RBXScriptSignal` — fires on any persisted/merged change (runtime Spark-backed).

**When:** Whole-profile UI refresh.

**Example**

```clpp
data.Changed~>Connect(func () { refresh(); });
```

### Data.Destroyed

**Returns:** `bool` field — `true` after `Destroy`.

**When:** Ignoring signals after release.

**Example**

```clpp
if (!data.Destroyed) { /* use data */ }
```

### Data::Get

**Returns:** `auto` — merged view (persisted + transient) at optional `path`, or root table when omitted.

**When:** Gameplay reads that should see session overlays.

**Example**

```clpp
int coins = data.Get(Keep.Client.Paths.Currencies.Coins); // 100
```

### Data::Get (path)

**Returns:** `auto` — value at `DataPath path`.

**When:** Typed path tokens.

**Example**

```clpp
auto v = data.Get(path);
```

### Data::GetPersisted

**Returns:** `auto` — saved ProfileStore slice only.

**When:** Auditing what will flush to DataStore.

**Example**

```clpp
int saved = data.GetPersisted(path);
```

### Data::GetPersisted (path)

**Returns:** `auto` at path.

**When:** Persisted subtree.

**Example**

```clpp
auto v = data.GetPersisted(path);
```

### Data::GetTransient

**Returns:** `auto` — transient overlay value or `nil`.

**When:** Buffs, round-only state not in save template.

**Example**

```clpp
auto buff = data.GetTransient(path);
```

### Data::GetTransient (path)

**Returns:** `auto` at path.

**When:** Addressed transient reads.

**Example**

```clpp
auto t = data.GetTransient(path);
```

### Data::HasTransient

**Returns:** `bool` — any transient layer present (root or subtree).

**When:** Branching UI for temporary stats.

**Example**

```clpp
bool has = data.HasTransient();
```

### Data::HasTransient (path)

**Returns:** `bool` at path.

**When:** Specific transient key.

**Example**

```clpp
bool has = data.HasTransient(path);
```

### Data::Set

**Returns:** Luau `nil`. Writes persisted path (replicates, saves).

**When:** Authoritative progression on server.

**Example**

```clpp
data.Set(path, 50); // coins become 50
```

### Data::SetTransient

**Returns:** Luau `nil`. Overlay only until cleared or session ends.

**When:** Round modifiers.

**Example**

```clpp
data.SetTransient(path, 2);
```

### Data::Update

**Returns:** `auto` — new value after `fn(old)` (persisted).

**When:** Atomic read-modify-write.

**Example**

```clpp
data.Update(path, func (int old) { return old + 1; }); // increments
```

### Data::UpdateTransient

**Returns:** `auto` — new transient value after `fn`.

**When:** Mutable session-only fields.

**Example**

```clpp
data.UpdateTransient(path, func (int old) { return old + 1; });
```

### Data::ClearTransient

**Returns:** Luau `nil`. Drops all transient overlays.

**When:** Round end.

**Example**

```clpp
data.ClearTransient();
```

### Data::ClearTransient (path)

**Returns:** Luau `nil`. Clears one transient path.

**When:** Remove one buff.

**Example**

```clpp
data.ClearTransient(path);
```

### Data::ArrayInsert

**Returns:** Luau `nil`. Appends or inserts into persisted array path.

**When:** Inventory lines, quest lists.

**Example**

```clpp
data.ArrayInsert(path, item);
```

### Data::ArrayInsert (path, value, index)

**Returns:** Luau `nil`. Inserts at `index`.

**When:** Ordered insert.

**Example**

```clpp
data.ArrayInsert(path, item, 1);
```

### Data::ArrayInsertTransient

**Returns:** Luau `nil`. Transient array append.

**When:** Session-only lists.

**Example**

```clpp
data.ArrayInsertTransient(path, item);
```

### Data::ArrayInsertTransient (path, value, index)

**Returns:** Luau `nil`. Indexed transient insert.

**When:** Ordered transient arrays.

**Example**

```clpp
data.ArrayInsertTransient(path, item, 2);
```

### Data::ArrayRemove

**Returns:** `auto` — removed element from persisted array.

**When:** Consume stack items.

**Example**

```clpp
auto removed = data.ArrayRemove(path, 1);
```

### Data::ArrayRemoveTransient

**Returns:** `auto` — removed transient element.

**When:** Session list edits.

**Example**

```clpp
auto removed = data.ArrayRemoveTransient(path, 1);
```

### Data::GetOrderedList

**Returns:** `auto` — ordered entries per `OrderedListOptions` (`key`, `order`, `limit`).

**When:** Leaderboards stored in data.

**Example**

```clpp
auto rows = data.GetOrderedList(path, OrderedListOptions { .key = "Score", .order = Keep.Enum.OrderList.Desc, .limit = 10 });
```

### Data::GetOrderedListWithPriority

**Returns:** `auto` — ordered list sorted by `key` ascending.

**When:** Priority queues in data.

**Example**

```clpp
auto list = data.GetOrderedListWithPriority(path, "Priority");
```

### Data::GetOrderedListWithPriority (path, key, order)

**Returns:** `auto` — with explicit `order` string (`Asc` / `Desc`).

**When:** Custom sort direction.

**Example**

```clpp
auto list = data.GetOrderedListWithPriority(path, "Priority", Keep.Enum.OrderList.Asc);
```

### Data::GetChangedSignal

**Returns:** `RBXScriptSignal` — value changes at path.

**When:** Binding one stat to UI.

**Example**

```clpp
data.GetChangedSignal(path)~>Connect(func (auto newV, auto oldV) {});
```

### Data::GetPathChangedSignal

**Returns:** `RBXScriptSignal` — subtree path changes.

**When:** Nested tables.

**Example**

```clpp
data.GetPathChangedSignal(path)~>Connect(func () {});
```

### Data::GetIndexChangedSignal

**Returns:** `RBXScriptSignal` — dictionary key or index updates.

**When:** Map-like data.

**Example**

```clpp
data.GetIndexChangedSignal(path)~>Connect(func (auto key, auto newV, auto oldV) {});
```

### Data::GetArrayInsertedSignal

**Returns:** `RBXScriptSignal` — `(index, value)` on insert.

**When:** List UI append animations.

**Example**

```clpp
data.GetArrayInsertedSignal(path)~>Connect(func (int i, auto v) {});
```

### Data::GetArrayRemovedSignal

**Returns:** `RBXScriptSignal` — `(index, value)` on remove.

**When:** List UI removals.

**Example**

```clpp
data.GetArrayRemovedSignal(path)~>Connect(func (int i, auto v) {});
```

### Data::Typed

**Returns:** `DataPath` — typed path token for IntelliSense.

**When:** Feeding generics from a base path.

**Example**

```clpp
DataPath typed = data.Typed(Keep.Server.Paths.Currencies.Coins);
```

### Data::Destroy

**Returns:** Luau `nil`. Ends session and disconnects listeners.

**When:** Player leaving custom handlers before engine teardown.

**Example**

```clpp
data.Destroy();
```

## API — KeepStore

### KeepStore.New

**Returns:** `KeepStore` — named store with template `tmpl` for reconciliation.

**When:** Custom keys outside the player service.

**Example**

```clpp
KeepStore store = KeepStore.New("Global", defaultTable);
```

### KeepStore.SetConstant

**Returns:** Luau `nil`. Registers a global constant on the store module.

**When:** Shared configuration values referenced by store logic.

**Example**

```clpp
KeepStore.SetConstant("Season", 2);
```

### KeepStore::StartSessionAsync

**Returns:** `DataProfile` — loaded session for `key` (yields).

**When:** Manual profile lifecycle.

**Example**

```clpp
DataProfile profile = store.StartSessionAsync("Player_123");
```

### KeepStore::GetAsync

**Returns:** `auto` — raw DataStore value for `key` (yields).

**When:** One-off reads without session.

**Example**

```clpp
auto raw = store.GetAsync("Player_123");
```

### KeepStore::MessageAsync

**Returns:** `bool` — `true` if `MessagingService` publish succeeded.

**When:** Cross-server messages (trades, mail).

**Example**

```clpp
bool sent = store.MessageAsync(key, payload);
```

### KeepStore::RemoveAsync

**Returns:** `bool` — `true` if removal succeeded.

**When:** GDPR wipe or reset key.

**Example**

```clpp
bool ok = store.RemoveAsync(key);
```

## API — KeepVersionQuery

Returned from store version listing helpers in the runtime; CL++ type exposes iteration.

### KeepVersionQuery::Get

**Returns:** `auto` — version metadata at `index`.

**When:** Random access in a version list.

**Example**

```clpp
auto info = query.Get(1);
```

### KeepVersionQuery::List

**Returns:** `auto` — array of all version entries collected.

**When:** Bulk inspection.

**Example**

```clpp
auto all = query.List();
```

### KeepVersionQuery::Next

**Returns:** `auto` — next version entry, or `nil` when exhausted.

**When:** Sequential walk.

**Example**

```clpp
auto item = query.Next();
```

## API — KeepTrade

### KeepTrade::Begin

**Returns:** `string` — trade id, or empty string if either profile already has an active trade.

**When:** Starting a two-player escrow session.

**Example**

```clpp
string tradeId = Keep.Trade.Begin(profileA, profileB); // non-empty guid
```

### KeepTrade::Reserve

**Returns:** `bool` — `true` if `amount` of `kind`/`ref` was deducted from spendable data into the trade vault. A second reserve on the same `kind|ref` for this trade fails.

**When:** Locking currencies/items before commit. Spendable `Get` after Reserve already shows the lower balance, so a second spend cannot duplicate.

**Example**

```clpp
bool ok = Keep.Trade.Reserve(profile, "Currency", "Coins", 10, tradeId);
```

### KeepTrade::Commit

**Returns:** `bool` — `true` if both offer lists moved from escrow with receipt ids and **both** `SaveWait`s succeeded. A failed save restores both in-memory snapshots and retries persist so a crash cannot duplicate.

**When:** Finalizing a trade on one server.

**Example**

```clpp
bool done = Keep.Trade.Commit(store, profileA, profileB, offersA, offersB);
```

### KeepTrade::Abort

**Returns:** Luau `nil`. Refunds remaining reserved rows for `tradeId` and clears `ActiveTradeId`.

**When:** Cancel or disconnect mid-trade. `EndSession` / player leave also call `AbortIfActive` before the last save.

**Example**

```clpp
Keep.Trade.Abort(profile, tradeId);
```

### KeepTrade::AbortIfActive

**Returns:** Luau `nil`. Aborts whatever `ActiveTradeId` is set.

**When:** Leave handlers; you usually do not call this yourself.

```clpp
Keep.Trade.AbortIfActive(profile);
```

### KeepTrade::SendOffline

**Returns:** `bool` — `true` if trade payload was messaged to offline `key`.

**When:** Completing credit when recipient is not in-server.

**Example**

```clpp
bool sent = Keep.Trade.SendOffline(store, key, payload);
```

## Supporting types (fields)

`DataBufferStats`: `Bytes`, `Messages`, `LastPacketBytes`, `LastUtilization` (numbers). `OrderedListOptions`: `key`, `order`, `limit`. `KeepTradeOffer`: `Kind`, `Ref`, `Amount`. `DataPath` is an opaque path token. `DataProfile` is the session handle: `IsActive`, `Reconcile`, `AddUserId`, `Save` (async), `SaveWait` (blocks until the DataStore write finishes), `EndSession`.
