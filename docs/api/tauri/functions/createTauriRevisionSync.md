[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriRevisionSync

# Function: createTauriRevisionSync()

```ts
function createTauriRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: [sync.ts:47](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L47)

Convenience factory that wires Tauri transport + core engine into one handle.

This is DX sugar only; it does not add new protocol semantics.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateTauriRevisionSyncOptions`](../interfaces/CreateTauriRevisionSyncOptions.md)\<`T`\> |

## Returns

`RevisionSyncHandle`
