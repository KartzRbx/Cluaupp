# Contributing

Requires Node.js 18+.

```bash
cd cluau
npm test
npm run generate-api    # headers + site/ from the API dump
npm run vendor-libs     # refresh runtime/ from cluau/vendor GitHub clones
node bin/cluaupp.js build ../game
```

## Layout

```
cluau/
  bin/cluaupp.js       CLI (shebang)
  src/lex.js         tokenizer
  src/parse.js       C++ subset
  src/emit.js        Luau
  src/api.js         Instance.new, methods, services
  src/understand.js    filename tags + AST intent scoring
  src/architecture.js  service folders (Main, Manager, Controller, Types)
  src/compile.js     public `compileSource` / `compileService` API
  include/cluaupp/     IntelliSense stubs
  runtime/           CluauppLibs (vendored GitHub libs + Net/Twinkle)
  scripts/vendor-libs.js  copy vendor/* clones into runtime/
  templates/game/    `cluaupp init`
  docs/              Moonwave markdown
  moonwave.toml      `npx moonwave dev`
  test/              transpile tests
```

## Minimum test

`test/leaderstats.test.js` checks the leaderstats service split. `test/understand.test.js` checks tags (`.server` / `.client` / `.legacy.*` / module) and that combat C++ becomes `CombatController`, not a fake CacheController.

New syntax: add a `.cpp` under `templates/game` or a case in the tests, then run `npm test`.

## Publishing

The npm package is the `cluau/` folder (not the monorepo root).

```bash
cd cluau
npm test
npm publish
```

`prepublishOnly` runs the tests. The npm account must be logged in (`npm login`).
