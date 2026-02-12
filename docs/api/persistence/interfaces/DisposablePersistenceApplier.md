[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / DisposablePersistenceApplier

# Interface: DisposablePersistenceApplier\<T\>

Defined in: [persistence/src/types.ts:16](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L16)

Extended SnapshotApplier with lifecycle management for persistence.

Wraps a standard applier with automatic save-to-storage behavior, throttling/debouncing,
event subscriptions, and cross-tab synchronization. Call [dispose](#dispose) when stopping
sync to clean up pending debounce timers, event listeners, and BroadcastChannel connections.

## Extends

- `SnapshotApplier`\<`T`\>

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state being persisted. |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [core/src/types.ts:191](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L191)

Applies the given snapshot to local state.

May be synchronous or asynchronous. If it returns a promise, the engine
will await it before advancing the local revision.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The SnapshotEnvelope containing the revision and payload to apply. |

#### Returns

`void` \| `Promise`\<`void`\>

#### Throws

If the local state update fails.

#### Inherited from

```ts
SnapshotApplier.apply
```

***

### dispose()

```ts
dispose(): void;
```

Defined in: [persistence/src/types.ts:26](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L26)

Cancels any pending debounced/throttled save operations and releases all
internal resources (timers, event listeners, BroadcastChannel).

After calling dispose, the applier becomes inert -- subsequent calls to
[apply](#apply), [flush](#flush), and event subscriptions are no-ops.

Should be called when sync is stopped to prevent memory leaks.

#### Returns

`void`

***

### flush()

```ts
flush(): Promise<void>;
```

Defined in: [persistence/src/types.ts:44](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L44)

Forces an immediate save of the most recently queued snapshot (if any).

Useful before calling [dispose](#dispose) to ensure no data is lost.
Resolves immediately if there is no pending save.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the flush completes (or immediately if nothing is pending).

***

### getStats()

```ts
getStats(): PersistenceStats;
```

Defined in: [persistence/src/types.ts:71](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L71)

Returns a snapshot of the current persistence statistics.

#### Returns

[`PersistenceStats`](PersistenceStats.md)

A copy of the current [PersistenceStats](PersistenceStats.md) including save counts,
  error counts, byte totals, and throttle metrics.

***

### hasPendingSave()

```ts
hasPendingSave(): boolean;
```

Defined in: [persistence/src/types.ts:34](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L34)

Returns `true` if there is a pending save operation that has been scheduled
but not yet written to storage.

#### Returns

`boolean`

Whether a save is currently queued by the throttle/debounce handler.

***

### on()

```ts
on<K>(event, handler): () => void;
```

Defined in: [persistence/src/types.ts:63](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L63)

Subscribe to a persistence lifecycle event.

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`PersistenceEvents`](PersistenceEvents.md)\<`T`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `K` | The event name to listen for (e.g., `'saveComplete'`, `'saveError'`). |
| `handler` | [`PersistenceEvents`](PersistenceEvents.md)\<`T`\>\[`K`\] | The callback invoked when the event fires. |

#### Returns

An unsubscribe function. Call it to remove the listener.

```ts
(): void;
```

##### Returns

`void`

#### Example

```typescript
const unsub = applier.on('saveComplete', (snapshot, durationMs) => {
  console.log(`Saved revision ${snapshot.revision} in ${durationMs}ms`);
});

// Later:
unsub();
```
