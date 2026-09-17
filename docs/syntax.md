# C++ → Luau syntax

Cluaupp is not a full C++ compiler. It is a **subset** aimed at Roblox scripts, in the same spirit as roblox-ts (restricted TypeScript → Luau).

Live grid of every construct: **[Language reference](https://kartzrbx.github.io/Cluaupp/docs/reference.html)**.

Generated Luau follows the current language: [`local`](https://luau.org/getting-started), `const`, and `const function`. Injected `require` / `GetService` lines are `const`. `--!strict` is emitted only when the file has `#pragma strict` (or `"strict": true` in config). `#pragma nstrict` never emits it.

## Files and includes

- Extensions: `.cpp`, `.cc`, `.cxx`, `.c`, `.h`, `.hpp`, `.hh`
- Tags: `*.server.cpp` → Script, `*.client.cpp` → LocalScript, `*.plugin.cpp` → Plugin, `*.legacy*` → Legacy, untagged → ModuleScript
- Quoted `#include "Own.h"` (same stem as the `.cpp`) is **inlined**. Other quoted includes become `require` (Rojo path)
- `#include <cluaupp/roblox.hpp>` is IntelliSense only. `#include <cluaupp/libs/janitor.hpp>` also injects `require(CluauppLibs.Janitor)`
- `#pragma once` is ignored. Other macros are not expanded. `//` and `/* */` comments are stripped
- `using …;` is skipped. `namespace { }` is flattened. `enum` / `template` / `typedef` / `extern` declarations are skipped

## Types

| C++ | Luau |
| --- | --- |
| `int` / `float` / `double` | `number` |
| `bool` | `boolean` |
| `string` | `string` (not `std::string`) |
| `void` | no return annotation |
| `auto` / `auto*` | inferred from `new` / `GetService` / datatype ctor |
| `Player*` / `Folder*` | `Player` / `Folder` (Instance handle, not a heap address) |
| `LuaArray<T>` / `vector<T>` / `array<T>` / `span<T>` | `{T}` |
| `optional<T>` | `T?` |
| `const` / `static constexpr` | Luau `const` |
| `nullptr` | `nil` |
| `Vector3` `CFrame` `UDim2` `Color3` | same names (copied values) |
| `Enum::Material::Plastic` | `Enum.Material.Plastic` |

Always initialize: `int coins = 0;` not `int coins;` (uninitialized emits `nil`). There is no `delete`, no `*part`, no `&part`, no `int&`. Numbers copy; Instances mutate through `->`.

`auto` infers when the value is `new Class(...)`, `GetService<T>()`, or a datatype constructor. Prefer explicit types on parameters and struct fields.

## Functions

```cpp
void CreateLeaderstats(Player* player) {
	return;
}

int doubleCoins(int coins) {
	return coins;
}
```

```luau
const function CreateLeaderstats(player: Player)
	return
end

const function doubleCoins(coins: number): number
	return coins
end
```

- Only functions with a body are emitted from a `.cpp`. Prototypes in a `.h` become `export type` fields
- No overloading — one name, one emit. No default arguments
- If `void init()` exists, emit appends `init()` at the end of Scripts / LocalScripts. There is no `int main()`
- Shared ModuleScripts should not define `init()` unless you want them to run on `require`

## Scopes

- File-level decls become file `local` / `const`
- Function decls become `local` from that line to the end of the block. Nested `{ }` can shadow
- In `Class::Method`, `this` is `self`. Bare field names become `self.field`. Bare calls to other methods become `self:Method(...)`. Parameters and locals shadow fields
- Globals stay bare: `print`, `game`, `workspace`, library types, Instance types, datatypes
- Instances are not RAII. Leaving a block does not Destroy a Part — use Janitor

## Control flow

```cpp
if (player->FindFirstChild("leaderstats") != nullptr) {
	return;
} else {
	print("ok");
}

while (true) {
	print("tick");
}

for (auto* player : players->GetPlayers()) {
	CreateLeaderstats(player);
}

switch (action) {
case "buy":
case "purchase":
	Grant(player);
	break;
case "sell":
	if (amount <= 0) {
		break;
	}
	Take(player);
	break;
default:
	warn("unknown");
	break;
}
```

```luau
if player:FindFirstChild("leaderstats") ~= nil then
	return
else
	print("ok")
end

while true do
	print("tick")
end

for _, player in players:GetPlayers() do
	CreateLeaderstats(player)
end

repeat
	if action == "buy" or action == "purchase" then
		Grant(player)
	elseif action == "sell" then
		if amount <= 0 then
			break
		end
		Take(player)
	else
		warn("unknown")
	end
until true
```

`switch` evaluates the discriminant **once**, then becomes `if` / `elseif` / `else` inside `repeat … until true` so `break` still exits the switch (even from inside an `if`). Stacked `case` labels share a body. There is no C-style fall-through. C-style `for (int i = 0; i < n; i++)` is not supported. No `continue`, no `do/while`, no ternary. `else if (x)` emits a nested `if` inside `else` (not Luau `elseif`).

## Expressions and operators

| C++ | Luau |
| --- | --- |
| `nullptr` | `nil` |
| `true` / `false` | `true` / `false` |
| `!=` | `~=` |
| `&&` | `and` |
| `\|\|` | `or` |
| `!` | `not` |
| `==` `+` `-` `*` `/` `<` `>` `<=` `>=` | same (`*` is multiply) |
| `"text"` | `"text"` |
| `=` | assignment |
| `obj->Prop` | `obj.Prop` |
| `obj->Method(a)` | `obj:Method(a)` if the method is a Roblox / library API |
| `fn(a)` | `fn(a)` |
| `signal.Connect(fn)` | `signal:Connect(fn)` |
| `Type { .Field = value }` | `{ Field = value }` |
| unary `-` | `-` |

No `++` `--` `+=`. Write `n = n + 1`. Binary operators in this subset are left-associative — use parentheses when mixing.

Designated initializers become Luau tables:

```cpp
DataService::Server.Init(DataServiceOptions {
	.Template = playerData,
	.StoreName = "PlayerData",
	.UseMock = true,
});
```

```luau
DataService.Server:Init({
	Template = playerData,
	StoreName = "PlayerData",
	UseMock = true,
})
```

## Strings and string_concat

Luau concatenates with `..`. Do not write `..` in a `.cpp`.

- If either side of `+` is a string literal, another concat, or `.Name` / `.Text` / `.DisplayName`, `+` becomes `..`
- `string_concat(a, b, c)` is variadic: zero args → `""`, one arg → that value, several → `(a .. b .. c)`
- Declared in `datatypes.hpp` (via `roblox.hpp`)

```cpp
return player->Name + "_LeaderstatsJanitor";
return string_concat(player->Name, "_", "LeaderstatsJanitor");
```

```luau
return player.Name .. "_LeaderstatsJanitor"
return (player.Name .. "_" .. "LeaderstatsJanitor")
```

## print / cout

`print`, `warn`, and `error` work as in Luau. `cout << … << endl` is the C++ spelling — each `<<` is another argument, `endl` ends the line. `cout::warn` / `cout::error` / `cout::ping` pick the Roblox function. `cerr` is `warn`. Full table: [print and cout](print-cout.md).

## `new` and services

```cpp
auto* coins = new IntValue(leaderstats);
auto* players = GetService<Players>();
auto* janitor = new Janitor();
part->Size = Vector3(8, 1, 8);
part->CFrame = CFrame::lookAt(from, look);
part->Material = Enum::Material::Plastic;
```

```luau
local coins: IntValue = Instance.new("IntValue")
coins.Parent = leaderstats
local players: Players = game:GetService("Players")
local janitor = Janitor.new()
part.Size = Vector3.new(8, 1, 8)
part.CFrame = CFrame.lookAt(from, look)
part.Material = Enum.Material.Plastic
```

The first argument of `new Class(parent)` becomes `.Parent` for Instance classes. Libraries use `Janitor.new()`. Datatypes use `Vector3(...)`, not `new`.

## Casts

`static_cast<T>(x)`, `const_cast`, `reinterpret_cast`, `dynamic_cast` emit the argument. `(void)x;` is omitted (silences unused for clangd). Luau has no casts — they do not check ClassName.

## Callbacks (events and lambdas)

Signals use `.Connect`. Callbacks may be **named functions** or **lambdas** (`[](Player* player) { ... }`, including `[&]` / `[=]` / `[coinsValue]`). Capture lists are accepted; Luau closures do not copy C++ captures — keep Instances alive with Janitor.

Passing a method by name from inside `Class::` binds `self`: `function(...) self:OnPlayer(...) end`.

```cpp
players->PlayerAdded.Connect([&](Player* playerEntered) {
	leaderstatsServer.PlayerEntered(playerEntered);
});
game->BindToClose([&]() {
	leaderstatsServer.janitor->Cleanup();
});
```

## OOP: structs, methods, singletons

How you write a type: a `struct` (or `class`) in the sibling `.h`, `Class::Method` in the `.cpp`, `void init()` to boot.

- `static constexpr` fields are `const`
- Fields are `self.field`. `public:` / `private:` are ignored
- Nested structs with defaults become nested tables (DataService Templates). `LuaArray<T>` fields stay on the table
- `Class::` methods emit `function Class:Method(...)`
- Construct **one** service table in `init()` (`LeaderstatsServer leaderstatsServer;`) and capture it in lambdas. That is the game singleton
- Library singletons already exist: `DataService::Server` / `Client` — `Init` once from a boot script
- Header-only field structs emit `const function Name()` returning defaults
- Untagged files of only `Class::` methods `return` the table (ModuleScript)

Stem must match: `LeaderstatsServer.h` next to `LeaderstatsServer.server.cpp`. A differently named include is a `require`, not the class body.

## Not supported

Custom C++ classes as metatables, generic templates besides `GetService<T>` / `static_cast<T>` / `LuaArray<T>` / `string_concat`, pointer arithmetic, `std::` (except mapped aliases), overloading, macros (except `#pragma strict` / `#pragma nstrict` / `#pragma once`), JSX / XML UI tags, C-style `for`, `++` `--` `+=`, `continue`, ternary, `do/while`, `try/catch`, `goto`, `int&` references.

CLI forms: [CLI](cli.md). How to write a type: [OOP](oop/index.md). Full handbook: **[Docs](https://kartzrbx.github.io/Cluaupp/docs/)**.
