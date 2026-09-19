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
include/clpp/        CL++ stubs (`roblox.clh`, libs)
runtime/             CluauppLibs copied into games on init/build (not @cluaupp/* npm packages)
templates/game/      `cluaupp init` scaffold (Roblox service folders)
examples/game/       same tree as the init template
editors/vscode/      optional diagnostics (prefer `clpp install`)
test/                out/, types, modules, security, clpp contract
docs/                `@cluaupp/docs` Starlight site — the only workspace package
```

## Tests

`npm test` runs security + understander tags, then CL++ compile tests (skipped if `clpp` is missing). CI builds `clpp` from KartzRbx/CLPP.

## Publishing

Released **1.4.1**. Next version is **1.5.0** (`package.json`). Libs are inside the `cluaupp` tarball. Do not revive `@cluaupp/dataservicev2` / `@cluaupp/janitor`.

```bash
npm test
npm publish
```
