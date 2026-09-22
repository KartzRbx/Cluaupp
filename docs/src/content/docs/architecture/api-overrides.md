---
title: API overrides & lock
description: Auditable overrides, lockfile, and reuse-first generation.
---

# Overrides, lock, and migration

## Overrides

Files under `api/overrides/` enrich the dump. Each file may include:

```json
{
  "_meta": {
    "reason": "why this override exists",
    "source": "where the knowledge came from",
    "introducedAt": "2026-09-22",
    "reviewAfter": "2027-03-22"
  }
}
```

`datatypes.json` holds datatype shapes the Mini dump does not define. Prefer dump + overrides over hand-edited headers.

## Lock

`api/roblox-api.lock.json` pins profile + overrides hashes and generated file checksums.

```bash
cluaupp api generate
cluaupp api verify
```

## Docs

Do **not** mirror Creator Docs into this handbook. Point humans at [create.roblox.com/docs](https://create.roblox.com/docs). Cluaupp may emit a short CLI/index pointer only.

## Migration from generate-api.js

`npm run generate-api` delegates to `cluaupp api generate`. Do not reintroduce manual `DATATYPE_SPEC` as the semantic source.
