[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotHandler

# Function: createElectronSnapshotHandler()

```ts
function createElectronSnapshotHandler<T>(options): ElectronSnapshotHandlerHandle;
```

Defined in: [main.ts:95](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L95)

Registers ipcMain.handle() for snapshot requests.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElectronSnapshotHandlerOptions`](../interfaces/ElectronSnapshotHandlerOptions.md)\<`T`\> |

## Returns

[`ElectronSnapshotHandlerHandle`](../interfaces/ElectronSnapshotHandlerHandle.md)
