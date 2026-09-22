---
title: Context Safety
description: Compile-time server/client capability rules — LocalPlayer, DataStores, remotes.
---

# Context Safety

Cluaupp attaches a **RunContext** from file tags and enforces **capability rules** before `clpp` runs.

| Tag | Context |
| --- | --- |
| `*.server.clpp` | Server |
| `*.client.clpp` | Client |
| `*.plugin.clpp` | Plugin |
| untagged / `.clp` | Shared |

Optional region markers inside a file: `[[server]]`, `[[client]]`, `[[shared]]`.

## Rules (v1)

| Code | Forbidden in | Pattern |
| --- | --- | --- |
| `CLUAUPP_CTX_LOCALPLAYER` | Server | `LocalPlayer` |
| `CLUAUPP_CTX_LOCALPLAYER_SHARED` | Shared (warning) | `LocalPlayer` |
| `CLUAUPP_CTX_DATASTORE` | Client | `DataStoreService` |
| `CLUAUPP_CTX_MESSAGING` | Client | `MessagingService` |
| `CLUAUPP_CTX_SERVERSTORAGE` | Client | `ServerStorage` |
| `CLUAUPP_CTX_FIRE_SERVER` | Server | `FireServer` |
| `CLUAUPP_CTX_FIRE_CLIENT` | Client | `FireClient` / `FireAllClients` |

Profile artifact: `api/generated/capability-profile.json` (also passed to `clpp api compile` as `capabilityProfilePath` + `runContext` for future CLPP enforcement).

```bash
cluaupp target capabilities
cluaupp target check-context path/to/Boot.server.clpp
```

Build fails on **error** severity; Shared `LocalPlayer` is a **warning** only.
