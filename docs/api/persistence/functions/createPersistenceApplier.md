[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createPersistenceApplier

# Function: createPersistenceApplier()

```ts
function createPersistenceApplier<T>(options): DisposablePersistenceApplier<T>;
```

Defined in: [persistence/src/persistence-applier.ts:253](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/persistence-applier.ts#L253)

Wraps an applier with automatic persistence.

On every apply(), the snapshot is saved to storage (with optional throttle/debounce).
The inner applier is always called, even if persistence fails.

IMPORTANT: Call dispose() when stopping sync to clean up pending timers.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PersistenceApplierOptions`](../interfaces/PersistenceApplierOptions.md)\<`T`\> |

## Returns

[`DisposablePersistenceApplier`](../interfaces/DisposablePersistenceApplier.md)\<`T`\>

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
