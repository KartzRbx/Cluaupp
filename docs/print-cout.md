---
title: print and cout
sidebar_position: 8
---

# print and cout

Cluaupp has no `<iostream>`. Logging is Roblox `print` / `warn` / `error`. You can still write C++-style `cout` / `cerr` / `endl` — the compiler flattens them.

## Globals

```cpp
print("ok");
warn("careful");
error("fail");
```

```luau
print("ok")
warn("careful")
error("fail")
```

`print` in C++ takes a string (and chained `cout` pieces). Do not expect full C++ `std::cout` overloads.

## Stream: `cout << … << endl`

Each `<<` is another argument. `endl` ends the statement (no extra `"\n"`).

```cpp
cout << "EnsureStat: " << name << " not found" << endl;
```

```luau
print("EnsureStat: ", name, " not found")
```

`cerr` is the same chain, emitted as `warn`:

```cpp
cerr << "failed to load " << player->Name << endl;
```

```luau
warn("failed to load ", player.Name)
```

## Levels: `cout::print` / `warn` / `error` / `ping`

Use `::` to pick the Roblox function. The stream still concatenates with `<<`.

```cpp
cout::print << "EnsureStat test: " << name << " not found" << endl;
cout::warn << "missing folder for " << player->Name << endl;
cout::error << "profile failed" << endl;
cout::ping << "here" << endl;
```

```luau
print("EnsureStat test: ", name, " not found")
warn("missing folder for ", player.Name)
error("profile failed")
print("here")
```

| C++ | Luau |
| --- | --- |
| `cout << … << endl` | `print(…)` |
| `cout::print << … << endl` | `print(…)` |
| `cout::warn << … << endl` | `warn(…)` |
| `cout::error << … << endl` | `error(…)` |
| `cout::ping << … << endl` | `print(…)` |
| `cerr << … << endl` | `warn(…)` |

`cout::ping` is a debug alias of `print` (no extra Studio highlight).

## Call form (no `<<`)

```cpp
cout::print("ok");
cout::warn("careful");
cout::error("fail");
cout::ping("here");
cout::endl();
```

`cout::endl()` is a no-op in Luau (flush is already the statement). Prefer `<< endl` on a stream.

## IntelliSense

`struct cout` / `cerr` and `endl` live in `<cluaupp/roblox.hpp>`. Include that header so clangd knows `cout::print` and `operator<<`.
