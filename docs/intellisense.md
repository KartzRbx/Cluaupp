# IntelliSense

`cluaupp init` and `cluaupp intellisense` install the same setup that works in Cursor:

1. Microsoft [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) (`ms-vscode.cpptools`)
2. `.vscode/c_cpp_properties.json` — LLVM `clang++`, C++20, `include/` + `src/`, `compile_commands.json`
3. Forced include of `include/cluaupp/roblox.hpp` so `GetService`, `Player`, `Janitor` complete
4. The Cluaupp completion engine (Roblox APIs + your `struct`s)

Cursor’s marketplace does not list `ms-vscode.cpptools`. Cluaupp downloads the official VSIX from [vscode-cpptools releases](https://github.com/microsoft/vscode-cpptools/releases) and runs `cursor --install-extension`.

## Install

```bash
cluaupp intellisense
```

Reload: Command Palette → **Developer: Reload Window**. Status bar `{} C++` should read **IntelliSense: Ready**.

`cluaupp build` / `watch` only refresh `compile_commands.json` (no download). They never keep deleted files in the compilation database.

## Config that ships

| File | Role |
| --- | --- |
| `.vscode/c_cpp_properties.json` | compiler path, include path, `compileCommands` |
| `.vscode/settings.json` | `C_Cpp.intelliSenseEngine: default`, `clangd.enable: false` |
| `.vscode/extensions.json` | recommends `ms-vscode.cpptools` |
| `compile_commands.json` | one entry per `src/` file |

`#include <cluaupp/roblox.hpp>` at the top of each source file. The header is not compiled to Luau.
