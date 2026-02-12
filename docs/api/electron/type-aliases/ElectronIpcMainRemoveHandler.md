[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcMainRemoveHandler

# Type Alias: ElectronIpcMainRemoveHandler()

```ts
type ElectronIpcMainRemoveHandler = (channel) => void;
```

Defined in: [types.ts:194](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L194)

Structural type matching `ipcMain.removeHandler()` from Electron.

Removes the handler previously registered via [ElectronIpcMainHandle](ElectronIpcMainHandle.md)
for the given channel. Used during cleanup/disposal.

**Process context:** main process only.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name whose handler should be removed. |

## Returns

`void`
