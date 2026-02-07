# Troubleshooting

::: tip Enable debug logging first
```typescript
import { createConsoleLogger } from '@statesync/core';

const sync = createRevisionSync({
  ...options,
  logger: createConsoleLogger({ debug: true }),
});
```
This will show: subscribed, invalidation received, snapshot applied, revision skips.
:::

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

## Events arrive but state doesn't update

**Symptoms**: Console shows "invalidation received" but UI doesn't change, or `getSnapshot` is never called.

**Checklist**:

| Check | How to verify |
|-------|---------------|
| Revision not increasing | Backend must increment revision on EACH change |
| Stale revision | If local revision >= event revision, skip is expected (not a bug) |
| Provider returns cached data | Ensure `getSnapshot()` fetches fresh data, not HTTP cache |
| Applier silently fails | Add `console.log` inside your `applier.apply()` function |
| Field in `omitKeys` | Check if the field you expect is excluded by `omitKeys` option |

**Debug snippet**:
```typescript
const sync = createRevisionSync({
  topic: 'my-topic',
  subscriber,
  provider: {
    async getSnapshot() {
      console.log('getSnapshot called');
      const data = await fetchData();
      console.log('returning', data);
      return data;
    }
  },
  applier: {
    apply(snapshot) {
      console.log('apply called with', snapshot);
      // your apply logic
    }
  },
  logger: createConsoleLogger({ debug: true }),
});
```

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

### `start`
**Cause**: failed during `handle.start()` setup.
**Action**: check that subscriber and provider are properly configured.

### `invalidation`
**Cause**: error processing an invalidation event.
**Action**: verify event payload shape matches expected `{ topic, revision }`.

### `refresh`
**Cause**: fallback — an error inside refresh that isn't classified as getSnapshot/apply/protocol.
**Action**: check logs for the full stack trace.

### `throttle`
**Cause**: error in the throttle/coalescing layer.
**Action**: check throttling configuration values.

## onError throws

If the `onError` callback throws, the engine catches and logs it. The engine keeps running — a user callback cannot bring down the sync loop.

## See also

- [Lifecycle contract](/lifecycle) — full method/phase reference
- [Error handling example](/examples/error-handling) — retry, fallback, UI indicators
- [Multi-window patterns](/guide/multi-window) — debugging multi-window issues
