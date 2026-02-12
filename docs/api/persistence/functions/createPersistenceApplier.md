[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createPersistenceApplier

# Function: createPersistenceApplier()

```ts
function createPersistenceApplier<T>(options): DisposablePersistenceApplier<T>;
```

Defined in: [persistence/src/persistence-applier.ts:264](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/persistence-applier.ts#L264)

Creates a [DisposablePersistenceApplier](../interfaces/DisposablePersistenceApplier.md) that wraps an inner applier
with automatic persistence to a storage backend.

On every `apply()` call, the snapshot is forwarded to the inner applier
**and** scheduled for saving to storage (with optional throttle/debounce).
The inner applier is always called, even if the persistence write fails.

**Lifecycle:** Call [dispose()](../interfaces/DisposablePersistenceApplier.md#dispose)
when stopping sync to clean up pending timers, event listeners, and
BroadcastChannel connections. Optionally call
[flush()](../interfaces/DisposablePersistenceApplier.md#flush) first to ensure
pending data is saved.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state being persisted. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`PersistenceApplierOptions`](../interfaces/PersistenceApplierOptions.md)\<`T`\> | Configuration for the persistence applier including storage backend, inner applier, throttling, compression, and cross-tab sync settings. |

## Returns

[`DisposablePersistenceApplier`](../interfaces/DisposablePersistenceApplier.md)\<`T`\>

A disposable persistence applier with event subscription and stats.

## Example

```typescript
const applier = createPersistenceApplier({
  storage: createLocalStorageBackend({ key: 'my-state' }),
  applier: createPiniaSnapshotApplier(useMyStore()),
  throttling: { debounceMs: 300, maxWaitMs: 2000 },
  schemaVersion: 2,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});

// Subscribe to events
const unsub = applier.on('saveComplete', (snapshot, duration) => {
  console.log(`Saved revision ${snapshot.revision} in ${duration}ms`);
});

// Get stats
console.log(applier.getStats());

// When stopping:
await applier.flush(); // Optional: save pending data
applier.dispose();
```
