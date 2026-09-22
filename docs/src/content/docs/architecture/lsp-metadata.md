---
title: CL++ LSP metadata contract
description: Cluaupp exports a stable JSON index; CLPP Language Server consumes it. No LSP in Cluaupp.
---

# LSP metadata contract

Cluaupp **does not** implement the Language Server Protocol for Roblox or CL++.

| Role | Owner |
| --- | --- |
| Parser, diagnostics, autocomplete, hover, go-to-def | **CLPP** Language Server (`clpp`) |
| Canonical Roblox API data | **Cluaupp** Target Profile + `lsp-index.json` |
| Rojo DataModel tree | **Rojo** sourcemap (read by CLPP / luau-lsp) |
| Emitted Luau IntelliSense | **luau-lsp** (optional) |

## Artifact

After `cluaupp api generate`:

`api/generated/lsp-index.json`

Shape (schemaVersion **1**):

- `classes[name].superclass`, `service`, `creatable`, `members[]` (`kind`, `name`, `detail`)
- `services[]`, `enums[]`, `datatypes[]`, `globals[]`
- `targetSchemaVersion` (RobloxTargetProfile schema)
- `generatorVersion` (Cluaupp package version)

CLPP should load this path (or the profile cache under `api/normalized/`) via `targetProfilePath` / env — not embed Roblox lists.

## Query helpers (non-product)

`listMembers` / `describeSymbol` / `similarSymbols` in `src/api/ide.ts` are thin registry lookups for tests and CLPP integration experiments. They are **not** an IntelliSense product.
