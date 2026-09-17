# IntelliSense

C++ completion, hover, and go-to-definition are **clangd**. Cluaupp does not ship a second completion engine.

`cluaupp init` / `cluaupp intellisense` install:

1. [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) (`llvm-vs-code-extensions.vscode-clangd`)
2. LLVM `clang++` when missing (Windows: `winget install --id LLVM.LLVM -e`)
3. `.clangd`, `compile_flags.txt`, and `compile_commands.json` so clangd finds `include/`
4. Forced include of `include/cluaupp/roblox.hpp` so `GetService`, `Player`, `Janitor` complete from the real C++ stubs

Tree-sitter is the **compiler** frontend (collect → emit Luau). It is not an editor language server. A homemade tokenizer in the CLI would fight clangd — that path is gone.

Microsoft `ms-vscode.cpptools` is **not** used and is **not licensed for Cursor**. Two C++ engines in the same window fight; Cluaupp recommends only clangd and marks cpptools as unwanted.

`cluaupp lsp` only publishes **subset parse errors** (code that clangd may accept as C++ but Cluaupp will not transpile).

## Headers clangd must see

`#include <cluaupp/roblox.hpp>` resolves only if `-Iinclude` is on the clangd compile flags. That maps to `include/cluaupp/roblox.hpp`. Angle-bracket includes are ignored by the transpiler.

`cluaupp init` / `build` / `watch` / `intellisense` rewrite:

- `-Iinclude` and `-Isrc`
- `-include include/cluaupp/roblox.hpp`
- one `compile_commands.json` entry per file under `src/`

## Install

```bash
cluaupp intellisense
```

Reload: Command Palette → **Developer: Reload Window**. clangd should attach to `.cpp` files.

`cluaupp build` / `watch` only refresh `compile_commands.json` (no download). They never keep deleted files in the compilation database.

## Config that ships

| File | Role |
| --- | --- |
| `.vscode/settings.json` | `clangd.enable: true`, `--compile-commands-dir` |
| `.vscode/extensions.json` | recommends `llvm-vs-code-extensions.vscode-clangd`; marks `ms-vscode.cpptools` unwanted |
| `.clangd` | C++20, `-Iinclude`, skip `out/` and `libs/` |
| `compile_flags.txt` | fallback flags if a file is not yet in `compile_commands.json` |
| `compile_commands.json` | one entry per `src/` file |

`#include <cluaupp/roblox.hpp>` at the top of each source file. The header is not compiled to Luau.
