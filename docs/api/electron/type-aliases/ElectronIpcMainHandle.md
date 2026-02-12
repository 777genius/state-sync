[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcMainHandle

# Type Alias: ElectronIpcMainHandle()

```ts
type ElectronIpcMainHandle = (channel, listener) => void;
```

Defined in: [types.ts:179](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/types.ts#L179)

Structural type matching `ipcMain.handle()` from Electron.

Registers an asynchronous handler for `ipcRenderer.invoke()` calls
on the given channel. Only one handler can be registered per channel.

**Process context:** main process only.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to handle. |
| `listener` | (`event`, ...`args`) => `unknown` | Async handler invoked when a renderer calls `ipcRenderer.invoke(channel)`. The first argument is the Electron `IpcMainInvokeEvent` (typed as `unknown` for structural compatibility), followed by any arguments from the renderer. |

## Returns

`void`
