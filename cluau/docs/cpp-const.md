---
title: const and immutability
sidebar_position: 11
---

# const and immutability

A value that must not change should say so. In C++ that is `const`. Cluaupp emits Luau `const`, not `local x <const>`.

```cpp
const int STARTING_COINS = 0;
const double GRAVITY = 196.2;
```

```luau
const STARTING_COINS: number = 0
const GRAVITY: number = 196.2
```

## Why it is a safety feature

- Leaderstat starting values, product IDs, remote names, and animation speeds are configuration. If they are `local`, a later line can overwrite them by accident.
- Reviewers see `const` and skip “could this mutate?”.
- Luau `--!strict` rejects assignment to `const`.

## What to keep mutable

Player-owned numbers (`coins`, `combo`), UI state, and Janitor instances. Everything else defaults to `const` until you have a reason.

```cpp
const string REMOTE_COINS = "Coins";
int coins = 0;

void AddCoins(int amount) {
	coins = coins + amount;
}
```

`REMOTE_COINS` is a protocol name — immutable. `coins` is session state — mutable.

## Immutability for tables and Instances

`const` on a pointer does not freeze the Instance. `const Folder* stats` still has a mutable `Name` in Roblox. Treat “do not rebind the variable” and “do not mutate the object” as two separate decisions. For objects, prefer:

- Create, parent, configure once, then only read.
- Put mutations behind one function (`SetCoins`) instead of writing `coins.Value` from five scripts.

## DataService paths

Path tokens (`"Currencies.Coins"`) should be `const string` or a shared header. Never concatenate remote or datastore keys from user input.

Next: [safety](cpp-safety.md).
