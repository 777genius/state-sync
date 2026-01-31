# Lifecycle Contract

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
| `subscribe` | Failed to subscribe to invalidation events | No |
| `getSnapshot` | Provider failed to return a snapshot | No |
| `protocol` | Revision validation failed (non-canonical, empty topic) | No |
| `apply` | Applier threw while applying a snapshot | Yes (apply failed) |
| `refresh` | Unclassified error inside the refresh loop | Depends |

## Observability fields (best-effort)

`SyncErrorContext` may additionally include (optionally) fields useful for triage/metrics:
- `localRevision?` — local revision at the time of the error
- `eventRevision?` — revision from the invalidation event (if applicable)
- `snapshotRevision?` — revision from the snapshot (if applicable)
- `sourceId?` — change originator (if the transport/source provides `sourceId`)

These fields are **best-effort**: the engine fills them when the information is available in the current phase.

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
