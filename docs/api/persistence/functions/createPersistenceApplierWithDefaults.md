[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createPersistenceApplierWithDefaults

# Function: createPersistenceApplierWithDefaults()

```ts
function createPersistenceApplierWithDefaults<T>(options): DisposablePersistenceApplier<T>;
```

Defined in: [persistence/src/persistence-applier.ts:615](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/persistence/src/persistence-applier.ts#L615)

Creates a persistence applier with common defaults.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PersistenceApplierOptions`](../interfaces/PersistenceApplierOptions.md)\<`T`\> & `object` |

## Returns

[`DisposablePersistenceApplier`](../interfaces/DisposablePersistenceApplier.md)\<`T`\>

## Example

```typescript
const applier = createPersistenceApplierWithDefaults({
  storage: createLocalStorageBackend({ key: 'my-state' }),
  applier: innerApplier,
  topic: 'settings', // Used for cross-tab channel name
});
```
