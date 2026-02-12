[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createPersistenceApplierWithDefaults

# Function: createPersistenceApplierWithDefaults()

```ts
function createPersistenceApplierWithDefaults<T>(options): DisposablePersistenceApplier<T>;
```

Defined in: [persistence/src/persistence-applier.ts:657](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/persistence-applier.ts#L657)

Creates a [DisposablePersistenceApplier](../interfaces/DisposablePersistenceApplier.md) with sensible defaults
pre-configured.

Defaults applied:
- **Throttling:** `debounceMs: 100`, `maxWaitMs: 2000` (if not provided)
- **Cross-tab sync:** Enabled when `enableCrossTab` is `true` and a `topic`
  is provided; the channel name defaults to `state-sync:<topic>`

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state being persisted. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`PersistenceApplierOptions`](../interfaces/PersistenceApplierOptions.md)\<`T`\> & `object` | All standard [PersistenceApplierOptions](../interfaces/PersistenceApplierOptions.md) plus: - `topic` -- optional topic string used to derive the BroadcastChannel name - `enableCrossTab` -- if `true` and `topic` is set, cross-tab sync is enabled |

## Returns

[`DisposablePersistenceApplier`](../interfaces/DisposablePersistenceApplier.md)\<`T`\>

A disposable persistence applier configured with defaults.

## Example

```typescript
const applier = createPersistenceApplierWithDefaults({
  storage: createLocalStorageBackend({ key: 'my-state' }),
  applier: innerApplier,
  topic: 'settings', // Used for cross-tab channel name
});
```
