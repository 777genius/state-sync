[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcMainRemoveHandler

# Type Alias: ElectronIpcMainRemoveHandler()

```ts
type ElectronIpcMainRemoveHandler = (channel) => void;
```

Defined in: [types.ts:194](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L194)

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
