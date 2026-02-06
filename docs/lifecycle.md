# Lifecycle Contract

`createRevisionSync()` returns a `RevisionSyncHandle` — a lightweight controller for the sync loop. This page documents its methods, error phases, and observability fields.

## RevisionSyncHandle

### `start()`

- Subscribes to invalidation events and loads the initial snapshot.
- **Idempotent**: repeated calls are a no-op (does not duplicate the subscription).
- **Throws** if called after `stop()` — protects against subscription leaks.
- On subscription or initial refresh failure, rolls back internal state (unsubscribe, `started = false`).

### `stop()`

- Unsubscribes from invalidation events and blocks further apply.
- **Idempotent**: repeated calls are a no-op.
- After `stop()`, the handle is considered "dead" — `start()` will throw.

### `refresh()`

- One-shot: fetch a snapshot from the provider and apply it via the applier.
- **Allowed before `start()`** — useful for eager prefetch without a subscription.
- **No-op after `stop()`** — does not throw, it simply skips.
- Supports coalescing: if a refresh is already in flight, the next call is queued (at most 1 queued).

### `getLocalRevision()`

- Returns the current local revision (the last successfully applied revision).
- `"0"` until the first successful apply.

## Error Phases

Every error passed to `onError` includes a `phase` field that indicates where it happened:

| Phase | What happened | Was the applier called? |
|-------|---------------|-----------------|
| `start` | Failed during `handle.start()` setup | No |
| `subscribe` | Failed to subscribe to invalidation events | No |
| `invalidation` | Error processing an invalidation event | No |
| `getSnapshot` | Provider failed to return a snapshot | No |
| `protocol` | Revision validation failed (non-canonical, empty topic) | No |
| `apply` | Applier threw while applying a snapshot | Yes (apply failed) |
| `refresh` | Unclassified error inside the refresh loop | Depends |
| `throttle` | Error in the throttle/coalescing layer | No |

## Observability fields (best-effort)

`SyncErrorContext` may additionally include fields useful for triage/metrics:

| Field | Type | Description |
|-------|------|-------------|
| `topic?` | `Topic` | Topic identifier |
| `localRevision?` | `Revision` | Local revision at the time of the error |
| `eventRevision?` | `Revision` | Revision from the invalidation event |
| `snapshotRevision?` | `Revision` | Revision from the snapshot |
| `sourceId?` | `string` | Change originator (if transport provides it) |
| `sourceEvent?` | `unknown` | Raw event payload (transport-specific) |
| `attempt?` | `number` | Current retry attempt number |
| `willRetry?` | `boolean` | Whether the engine will retry after this error |
| `nextDelayMs?` | `number` | Delay before the next retry attempt |

These fields are best-effort: the engine fills them when the information is available in the current phase.

**Behavior on `apply` error:**
- During `start()` — the `start()` promise rejects; the subscription is rolled back (unsubscribe, `started = false`).
- During invalidation-triggered refresh — `onError` is emitted; the subscription continues (the next invalidation can trigger refresh again).
- During manual `refresh()` — the error propagates to the caller.

**Classification order within `refresh()` errors:**
1. `getSnapshot` — provider failed to return data
2. `protocol` — revision validation failed
3. `apply` — applier failed to apply the snapshot
4. `refresh` — fallback for unexpected errors

Each phase is emitted at most once per error (deduplicated via the `alreadyEmitted` flag).

## onError callback

- Called for errors in all phases: `subscribe`, `refresh`, `protocol`, etc.
- **If `onError` throws** — the engine catches and logs it, and continues running.
- The engine never crashes due to a user-provided `onError` callback.

## Call order

```
createRevisionSync(options)  →  handle (inactive)
    ↓
handle.refresh()             →  optional: one-shot fetch+apply
    ↓
handle.start()               →  subscribe + initial refresh
    ↓
[invalidation events]        →  automatic refresh cycle
    ↓
handle.stop()                →  unsubscribe, block further apply
```

## See also

- [Troubleshooting](/troubleshooting) — debug common issues by error phase
- [Error handling example](/examples/error-handling) — retry, fallback, UI indicators
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
