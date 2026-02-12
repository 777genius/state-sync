[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createRevisionSync

# Function: createRevisionSync()

```ts
function createRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: [engine.ts:190](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/engine.ts#L190)

Creates a revision-based state synchronization loop.

The returned [RevisionSyncHandle](../interfaces/RevisionSyncHandle.md) is inert until [start()](../interfaces/RevisionSyncHandle.md#start)
is called. Once started, the engine:

1. Subscribes to invalidation events via the provided [InvalidationSubscriber](../interfaces/InvalidationSubscriber.md).
2. Fetches the initial snapshot via the provided [SnapshotProvider](../interfaces/SnapshotProvider.md).
3. Applies the snapshot via the provided [SnapshotApplier](../interfaces/SnapshotApplier.md) if it is newer.
4. On each subsequent invalidation event whose revision exceeds the local revision,
   triggers a new fetch-and-apply cycle (subject to optional throttling).

Concurrent refreshes are coalesced: at most one fetch is in flight at a time,
and a trailing refresh is automatically queued if events arrive mid-flight.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`RevisionSyncOptions`](../interfaces/RevisionSyncOptions.md)\<`T`\> | Configuration for the sync loop. See [RevisionSyncOptions](../interfaces/RevisionSyncOptions.md). |

## Returns

[`RevisionSyncHandle`](../interfaces/RevisionSyncHandle.md)

A [RevisionSyncHandle](../interfaces/RevisionSyncHandle.md) to control the sync lifecycle.

## Throws

If `options.topic` is not a non-empty string (fails synchronously).

## Example

```ts
const handle = createRevisionSync<UserProfile>({
  topic: 'user-profile',
  subscriber: webSocketSubscriber,
  provider: httpSnapshotProvider,
  applier: { apply: ({ data }) => store.setState(data) },
});

await handle.start();
// Sync is now running. Call handle.stop() to tear down.
```
