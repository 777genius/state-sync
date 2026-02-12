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

Defined in: [persistence/src/persistence-applier.ts:477](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/persistence-applier.ts#L477)

Loads a persisted snapshot from storage, validates it, optionally migrates it,
and applies it to the given applier.

Use this function to hydrate application state from cache **before** starting
a live sync connection. The function performs several checks in order:

1. **Load** -- reads the snapshot (with metadata if the backend supports it)
2. **TTL check** -- discards expired snapshots unless `ignoreTTL` is set
3. **Integrity check** -- verifies hash if `verifyHash` is set and a hash exists
4. **Revision validation** -- ensures the revision string is canonical
5. **Migration** -- upgrades the data if the stored schema version is outdated
6. **Custom validation** -- runs the user-supplied validator (if any)
7. **Apply** -- delegates to the applier

Returns the loaded snapshot on success, or `null` if nothing was stored,
validation failed, the cache expired, or any other error occurred.

This function supports two call signatures for backward compatibility:
- `loadPersistedSnapshot(storage, applier, options)` -- preferred
- `loadPersistedSnapshot(storage, applier, onError, options)` -- legacy

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\> | The storage backend to load from. |
| `applier` | \{ `apply`: `void` \| `Promise`\<`void`\>; \} | An object with an `apply` method to receive the loaded snapshot. |
| `applier.apply` | - |
| `onErrorOrOptions?` | \| [`LoadOptions`](../interfaces/LoadOptions.md)\<`T`\> \| (`context`) => `void` | Either a [LoadOptions](../interfaces/LoadOptions.md) object (preferred) or an error callback function (legacy signature). |
| `loadOptions?` | [`LoadOptions`](../interfaces/LoadOptions.md)\<`T`\> | Load options when the third argument is an error callback (legacy signature only). |

## Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

The loaded and applied snapshot, or `null` if loading/validation failed.

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
