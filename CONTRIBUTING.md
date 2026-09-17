# Contributing

Requires Node.js 18+.

```bash
npm test
npm run build:cli
npm run generate-api    # headers + site/ from the API dump
npm run vendor-libs     # refresh runtime/ from vendor/ GitHub clones
```

## Layout

```
bin/cluaupp.js       CLI entry
src/                 TypeScript compiler (never C++ game scripts)
generated/           tsc output
include/cluaupp/     IntelliSense stubs
runtime/             CluauppLibs copied into games on init/build
templates/game/      `cluaupp init` scaffold
examples/game/       sample C++ (`src/server`, `src/client`, `src/shared`)
editors/vscode/      optional subset-diagnostics extension (completion is clangd)
test/                out/ tree, types, modules, security, understander
scripts/             generate-api, vendor-libs
docs/                guides
```

C++ examples are **not** under the compiler `src/` — that folder is TypeScript, like [roblox-ts](https://github.com/roblox-ts/roblox-ts) and [roblox-cs](https://github.com/roblox-csharp/roblox-cs). The old `src/client` / `src/server` / `src/shared` tree is `examples/game/src/`.

`game/` is a local playground (`npm run dev`). It is gitignored and is not part of the CLI.

## Tests

`npm test` runs:

- `test/out.test.js` — `cluaupp build` → `out/` tree (template 1:1, filename tags, architecture folders, prune / hold-on-error, SystemUnderstander comments)
- `test/types.test.js` — Luau types (`GetService`, `export type`, `--!strict`, DataService, cout, switch)
- `test/modules.test.js` — `#include` → `require`, header / `*Impl.luau`, CluauppLibs
- `test/security.test.js` — path confinement, config allowlist, no `.env` in the npm pack
- `test/understander.test.js` — filename tags, token density, Controller vs utility

New emit: add a case there, then run `npm test`.

## Publishing

```bash
npm test
npm publish
```

`prepublishOnly` compiles the CLI and runs the tests. The npm account must be logged in (`npm login`).
