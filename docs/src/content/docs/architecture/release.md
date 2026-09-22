---
title: Target Profile release
description: Versioning schema, generator, lock checksums, and release checklist.
---

# Release engineering

- `schemaVersion` lives on `RobloxTargetProfile` (currently **2**).
- Generator version = Cluaupp `package.json` version.
- `api/roblox-api.lock.json` pins profile + overrides + artifact hashes.
- `cluaupp api generate` writes manifest under `api/manifests/`.
- Checklist helper: `buildReleaseChecklist()` in `src/api/release.ts`.

```bash
cluaupp api generate
cluaupp api verify
cluaupp target doctor
```
