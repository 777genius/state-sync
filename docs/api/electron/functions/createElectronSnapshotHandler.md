[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotHandler

# Function: createElectronSnapshotHandler()

```ts
function createElectronSnapshotHandler<T>(options): ElectronSnapshotHandlerHandle;
```

Defined in: main.ts:84

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
