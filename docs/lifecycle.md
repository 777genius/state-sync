# Lifecycle Contract

`createRevisionSync(options)` returns a `RevisionSyncHandle` -- a lightweight controller for the sync loop.

## RevisionSyncOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `topic` | `string` | Yes | Non-empty topic identifier |
| `subscriber` | `InvalidationSubscriber` | Yes | Delivers invalidation events |
| `provider` | `SnapshotProvider<T>` | Yes | Returns the latest snapshot |
| `applier` | `SnapshotApplier<T>` | Yes | Writes state into your store |
| `shouldRefresh` | `(event) => boolean` | No | Filter which events trigger a refresh |
| `logger` | `Logger` | No | Debug/warn/error logging |
| `onError` | `(ctx: SyncErrorContext) => void` | No | Error callback for all phases |
| `throttling` | `InvalidationThrottlingOptions` | No | Debounce/throttle refresh rate |

### Throttling options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debounceMs` | `number` | - | Wait for N ms of silence before refreshing |
| `throttleMs` | `number` | - | At most 1 refresh per N ms |
| `leading` | `boolean` | `true` | Fire on the leading edge (throttle only) |
| `trailing` | `boolean` | `true` | Fire on the trailing edge (throttle only) |

## RevisionSyncHandle

### `start()`

- Subscribes to invalidation events, then performs an initial refresh.
- **Idempotent**: repeated calls are a no-op.
- **Throws** if called after `stop()`.
- On failure (subscribe or initial refresh), rolls back state: unsubscribes, resets `started = false`.

### `stop()`

- Unsubscribes from events and blocks further applies.
- **Idempotent**: repeated calls are a no-op.
- After `stop()`, the handle is dead -- `start()` will throw.

### `refresh()`

- One-shot: fetch snapshot from provider and apply if newer.
- **Allowed before `start()`** -- useful for eager prefetch without subscription.
- **No-op after `stop()`** -- does not throw, silently skips.
- Supports coalescing: at most 1 refresh is queued while one is in-flight.

### `getLocalRevision()`

- Returns the last successfully applied revision.
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
createRevisionSync(options)  →  handle (inactive, localRevision = "0")
    ↓
handle.refresh()             →  optional: one-shot fetch + apply
    ↓
handle.start()               →  subscribe → initial refresh
    ↓
[invalidation events]        →  automatic refresh cycle (with coalescing + throttle)
    ↓
handle.stop()                →  unsubscribe, dispose throttle, block further apply
```

## See also

- [Troubleshooting](/troubleshooting) — debug common issues by error phase
- [Error handling example](/examples/error-handling) — retry, fallback, UI indicators
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
