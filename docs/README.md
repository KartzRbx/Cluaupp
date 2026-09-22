# Cluaupp docs (Starlight)

Astro Starlight handbook for the **toolchain** (project host, registry, Context Safety, libraries). The language course stays on [kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/).

```bash
npm run site:dev    # from repo root
npm run site        # writes ../site (set SITE_BASE=/Cluaupp for Pages)
```

Key pages: home splash, [Why Cluaupp](src/content/docs/why-cluaupp.md), [Benchmarks](src/content/docs/benchmarks.md), [Comparison](src/content/docs/comparison.md), [Architecture](src/content/docs/architecture/).

Fences use language id `clpp`. Prefer CL++ **0.8+** examples (`import { } from`, Option/Result). Do not invent C++ (`Player*`, `->`, `fn`, `class`).

After editing links, run `node scripts/fix-docs-links.cjs` only if you reintroduce root-absolute `](/…)` links — relative links are required under `base: /Cluaupp/`.
