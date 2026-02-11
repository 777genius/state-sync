[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronRevisionSync

# Function: createElectronRevisionSync()

```ts
function createElectronRevisionSync<T>(options): RevisionSyncHandle;
```

Defined in: sync.ts:37

Convenience factory wiring Electron bridge → transport → core engine.
Mirrors createTauriRevisionSync.

Accepts bridge (high-level) instead of separate listen/invoke
because in Electron the bridge is always a single object on window.
Internally decomposes into listen + invoke for the transport layer.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateElectronRevisionSyncOptions`](../interfaces/CreateElectronRevisionSyncOptions.md)\<`T`\> |

## Returns

`RevisionSyncHandle`
