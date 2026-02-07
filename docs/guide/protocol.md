---
title: Protocol (mental model)
---

# How state-sync works

This page explains the invalidation-pull protocol that keeps state consistent across windows.

## The pattern

1. **Invalidation event** — a lightweight signal meaning "this state may have changed". It carries only a `topic` and `revision`, not the full data.
2. The receiver does a **pull**: `provider.getSnapshot()`
3. The engine applies the snapshot only if it is **newer** (revision gate).

Why this works:
- Events can arrive **out of order** — the revision gate rejects stale ones
- Events can be **lost** — the pull always fetches the latest
- The snapshot remains the **source of truth**

## Key terms

| Term | Meaning |
|------|---------|
| **Topic** | Unique string identifier for a piece of state (e.g., `'settings'`, `'cart'`) |
| **Revision** | Monotonic counter (canonical decimal `u64` string: `"0"`, `"42"`, no leading zeros) |
| **Invalidation** | Signal that says "state may have changed" — carries topic + revision only |
| **Coalescing** | If multiple invalidation events arrive while a refresh is in progress, only one additional refresh is queued — not one per event |
| **Snapshot** | Full state fetched from the provider (`{ revision, data }`) |

## Contracts

| Type | Fields |
|------|--------|
| `InvalidationEvent` | `topic: string`, `revision: Revision` |
| `SnapshotEnvelope<T>` | `revision: Revision`, `data: T` |

`Revision` is a canonical decimal `u64` string (e.g. `"0"`, `"42"`, `"18446744073709551615"`).

## What is a protocol error

The engine reports `phase='protocol'` when:
- `topic` is empty / not a string
- `revision` is not canonical (`"01"`, `"abc"`, etc.)

## See also

- [Quickstart](/guide/quickstart) — wire subscriber, provider, applier
- [Lifecycle contract](/lifecycle) — method semantics, error phases
- [Troubleshooting](/troubleshooting) — debug common issues
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
