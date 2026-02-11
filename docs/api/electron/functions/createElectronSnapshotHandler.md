[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotHandler

# Function: createElectronSnapshotHandler()

```ts
function createElectronSnapshotHandler<T>(options): ElectronSnapshotHandlerHandle;
```

Defined in: [main.ts:95](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/main.ts#L95)

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
