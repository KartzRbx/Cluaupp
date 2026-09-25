---
title: Option and Result
description: Option/optional, Result, try (?), and exhaustive match — CL++ 0.8+ (RFC 0012 / 0013).
sidebar:
  order: 3
---

# Option and Result

CL++ **0.8+** ships Intent core types for absence and recoverable errors. Full guide upstream: [CL++ option-result](https://github.com/KartzRbx/CLPP/blob/main/docs/option-result.md).

## Option

| CL++ | Luau |
| --- | --- |
| `Option<T>` / `optional<T>` | `T?` |
| `Some(x)` | `x` |
| `None` | `nil` |

```clpp
optional<int> maybe = Some(1);
match (maybe) {
	Some v => { post(v); },
	None => { },
}
```

For Instances, prefer an explicit `null` check after `FindFirstChild` — same emit as `None`.

## Result

| CL++ | Luau |
| --- | --- |
| `Result<T, E>` | tagged table |
| `Ok(v)` | `{ ok = v }` |
| `Err(e)` | `{ err = e }` |
| `expr?` | early-return on `err` |

Use `import` for module dependencies:

```clpp
import { Option, Result } from "Include/Core/OptionResult";
```

```clpp
Result<int, string> parse(string s) {
	if (s == "") {
		return Err("empty");
	}
	return Ok(to_number(s));
}

int use(string s) {
	int n = parse(s)?;
	return n + 1;
}

int unwrap_or(Result<int, string> r, int fallback) {
	match (r) {
		Ok v => { return v; },
		Err e => { return fallback; },
	}
}
```

Conceptual load flow (recoverable DataStore errors):

```clpp
import { Option, Result } from "Include/Core/OptionResult";

Result<PlayerData, string> LoadData(uint64 userId) {
	if (DataStoreFailed) {
		return Err("Falha de conexao com o DataStore");
	}
	return Ok(data);
}
```

## Diagnostics

| Code | Meaning |
| --- | --- |
| **CLPP0202** | Assigning a `Result` to a plain `T` — use `match`, `?`, or change the type |
| **CLPP1101** | `?` on a non-Result |
| **CLPP1102** | Non-exhaustive Option/Result `match` — need `Ok`+`Err` / `Some`+`None` or `_` |

## Precedence note

`?` (try) binds **after** assignment and **before** Roblox `obj:method` and the ternary `c ? t : e`. It is **not** optional chaining and **not** `try/catch` (that still maps to `pcall`).

```text
assign → expr? → colon (:) → ternary → ?? → …
```

## Not yet

Nested patterns, or-patterns, match guards, and ADTs beyond Option/Result are RFC later — do not invent them.

Next: [Types](../types/) · [Syntax](../syntax/) · [Modules](../modules/).
