[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / loadPersistedSnapshot

# Function: loadPersistedSnapshot()

```ts
function loadPersistedSnapshot<T>(
   storage, 
   applier, 
   onErrorOrOptions?, 
loadOptions?): Promise<SnapshotEnvelope<T> | null>;
```

Defined in: [persistence/src/persistence-applier.ts:447](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/persistence-applier.ts#L447)

Loads a persisted snapshot and applies it.

Use this to hydrate state before starting sync.
Returns the loaded snapshot, or null if none exists or if validation fails.

Features:
- Revision validation
- Schema migration
- TTL expiration check
- Optional integrity verification

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\> |
| `applier` | \{ `apply`: `void` \| `Promise`\<`void`\>; \} |
| `applier.apply` |
| `onErrorOrOptions?` | \| [`LoadOptions`](../interfaces/LoadOptions.md)\<`T`\> \| (`context`) => `void` |
| `loadOptions?` | [`LoadOptions`](../interfaces/LoadOptions.md)\<`T`\> |

## Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

## Example

```typescript
const cached = await loadPersistedSnapshot(storage, applier, {
  migration: {
    currentVersion: 3,
    migrations: {
      1: (v1) => ({ ...v1, newField: 'default' }),
      2: (v2) => ({ ...v2, renamedField: v2.oldField }),
    },
  },
});

if (cached) {
  console.log('Restored from cache, revision:', cached.revision);
}
```
