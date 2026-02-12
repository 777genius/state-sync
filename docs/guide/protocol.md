---
title: Protocol (mental model)
---

# How state-sync works

The invalidation-pull protocol that keeps state consistent across windows, tabs, and processes.

## The pattern

1. **Invalidation event** — a lightweight signal carrying `topic` and `revision` (not the full data).
2. The engine **pulls** the latest snapshot: `provider.getSnapshot()`.
3. The snapshot is applied only if its revision is **newer** than the local one.

Why this works:
- Events can arrive **out of order** — the revision gate rejects stale ones
- Events can be **lost** — the pull always fetches the latest
- The snapshot is the **single source of truth**

## Key terms

| Term | Meaning |
|------|---------|
| **Topic** | Non-empty string identifier for a piece of state (e.g., `'settings'`, `'cart'`) |
| **Revision** | Monotonic counter — canonical decimal `u64` string (`"0"`, `"42"`, no leading zeros) |
| **Invalidation** | Signal carrying `topic` + `revision`, optionally `sourceId` and `timestampMs` |
| **Coalescing** | Multiple events during an in-flight refresh collapse into one queued refresh |
| **Snapshot** | Full state from the provider: `{ revision, data }` |

## Contracts

| Type | Fields |
|------|--------|
| `InvalidationEvent` | `topic: string`, `revision: Revision`, `sourceId?: string`, `timestampMs?: number` |
| `SnapshotEnvelope<T>` | `revision: Revision`, `data: T` |

`Revision` is a branded `string` (`string & { __brand: 'Revision' }`). Valid values: canonical decimal `u64` — `"0"`, `"42"`, up to `"18446744073709551615"`. No leading zeros except `"0"` itself.

## Protocol errors

The engine emits `phase='protocol'` when:
- `topic` is empty or not a string
- `revision` is not canonical (`"01"`, `"abc"`, negative, exceeds u64 max)

These checks apply to both invalidation events and snapshot envelopes.

## See also

- [Quickstart](/guide/quickstart) — wire subscriber, provider, applier
- [Lifecycle contract](/lifecycle) — method semantics, error phases
- [Troubleshooting](/troubleshooting) — debug common issues
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
