[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriRevisionSync

# Function: createTauriRevisionSync()

```ts
function createTauriRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: [sync.ts:56](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/tauri/src/sync.ts#L56)

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
