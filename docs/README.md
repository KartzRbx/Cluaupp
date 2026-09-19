# Cluaupp docs (Starlight)

Astro Starlight handbook for the **toolchain**. The language course stays on [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

```
docs/
  astro.config.mjs
  src/syntaxes/clpp.tmLanguage.json   # official CL++ grammar (Shiki)
  src/content/docs/
    index.mdx
    cli/
    language/
    internals/
```

```bash
npm run site:dev    # from repo root
npm run site        # writes ../site for GitHub Pages
```

Fences use language id `clpp`. Tabs compare CL++ 0.3.2 with emitted Luau. Do not invent C++ (`Player*`, `->`, `fn`, `class`).
