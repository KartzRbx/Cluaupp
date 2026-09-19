# Contributing

Requires Node.js 18+ and **`clpp` on PATH** ([KartzRbx/CLPP](https://github.com/KartzRbx/CLPP)).

```bash
npm test
npm run build:cli
npm run site:dev    # Starlight handbook
```

## Layout

```
bin/cluaupp.js       CLI entry
src/                 TypeScript toolchain (clpp runner, Rojo, libs)
src/clpp/            CL++ contract, spawn, postprocess
generated/           tsc output
include/clpp/            CL++ stubs (`roblox.clh`, libs)
runtime/             CluauppLibs copied into games on init/build
templates/game/      `cluaupp init` scaffold (CL++)
examples/game/       sample CL++ (`src/server`, `src/client`, `src/shared`)
editors/vscode/      optional diagnostics (prefer `clpp install`)
test/                out/, types, modules, security, clpp contract
docs/                Starlight site (Astro) — language course stays at kartzrbx.github.io/CLPP
```

## Tests

`npm test` runs security + understander tags, then CL++ compile tests (skipped if `clpp` is missing). CI builds `clpp` from KartzRbx/CLPP.

## Publishing

```bash
npm test
npm publish
```
