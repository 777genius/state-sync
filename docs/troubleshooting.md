# Troubleshooting

## Non-canonical revision

**Error**: `Non-canonical snapshot revision: "01"`

Revision must be a canonical decimal `u64` string:
- `"0"` — OK
- `"123"` — OK
- `"01"` — NOT OK (leading zero)
- `"abc"` — NOT OK (not a number)
- `""` — NOT OK (empty string)

**Fix**: make sure the backend returns revision without leading zeros. Revision is the string representation of an unsigned 64-bit integer.

## Topic mismatch

**Symptom**: invalidation events arrive, but the snapshot is not updated.

**Cause**: the topic in the invalidation event does not match the topic passed to `createRevisionSync()`.

**Fix**: ensure backend and frontend use the same topic string. Topic comparison is strict (`===`).

## Multiple windows / race conditions

**Symptom**: multiple windows compete for updates; data “jumps”.

The engine provides:
- Coalescing: multiple invalidations are collapsed into a single refresh
- Revision monotonicity: snapshots are applied only if their revision is strictly greater than the current local revision

If the issue persists, verify that your snapshot provider returns fresh data (not cached).

## start() after stop()

**Error**: `[state-sync] start() called after stop()`

The handle is single-use: after `stop()` you cannot call `start()` again. This protects against subscription leaks.

**Fix**: create a new handle via `createRevisionSync()`.

## Interpreting error phases

The `phase` field in `SyncErrorContext` helps you quickly identify the source of the problem:

### `getSnapshot`
**Cause**: the provider failed to return a snapshot (network, timeout, backend down).
**Action**: check backend availability. If you use Tauri `invoke`, ensure the Rust command is registered and returns data.

### `apply`
**Cause**: the applier threw while processing the snapshot (deserialization error, invalid data, Pinia store rejection).
**Action**: validate the snapshot data shape. Ensure the applier handles all expected forms of `data`.

### `protocol`
**Cause**: contract violation — non-canonical revision, empty topic, or payload does not match the expected shape.
**Action**: ensure backend generates a canonical revision (decimal `u64` without leading zeros). Verify invalidation payloads.

### `subscribe`
**Cause**: failed to subscribe to events (transport unavailable, Tauri listener error).
**Action**: ensure transport is configured correctly and the event name matches.

### `refresh`
**Cause**: fallback — an error inside refresh that isn’t classified as getSnapshot/apply/protocol.
**Action**: check logs for the full stack trace.

## Useful context fields

Besides `phase`, the engine may (best-effort) populate:
- `localRevision` — local revision at the time of the error
- `eventRevision` — revision from the invalidation event (if applicable)
- `snapshotRevision` — snapshot revision (if applicable)
- `sourceId` — change originator (if the transport provides it)

This is useful for metrics/alerts (e.g., “apply errors by topic”).

## onError throws

If the `onError` callback throws, the engine catches and logs it. The engine keeps running — a user callback cannot bring down the sync loop.
