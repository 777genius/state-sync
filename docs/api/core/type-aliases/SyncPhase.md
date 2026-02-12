[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SyncPhase

# Type Alias: SyncPhase

```ts
type SyncPhase = 
  | "start"
  | "subscribe"
  | "invalidation"
  | "refresh"
  | "getSnapshot"
  | "apply"
  | "protocol"
  | "throttle";
```

Defined in: [types.ts:245](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L245)

Identifies the phase of the sync lifecycle where an error occurred.

Used in [SyncErrorContext](../interfaces/SyncErrorContext.md) to let error handlers categorize and
route errors (e.g. alerting on `'protocol'` errors, retrying on `'getSnapshot'`).

- `'start'`         - Error during initial engine startup.
- `'subscribe'`     - Error while subscribing to invalidation events.
- `'invalidation'`  - Error while processing an incoming invalidation event.
- `'refresh'`       - General error during a refresh cycle.
- `'getSnapshot'`   - Error while fetching the snapshot from the provider.
- `'apply'`         - Error while applying the snapshot to local state.
- `'protocol'`      - Protocol-level error (e.g. non-canonical revision, empty topic).
- `'throttle'`      - Error in the throttling/debounce layer.
