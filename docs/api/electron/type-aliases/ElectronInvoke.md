[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvoke

# Type Alias: ElectronInvoke()

```ts
type ElectronInvoke = (channel, ...args) => Promise<unknown>;
```

Defined in: [types.ts:91](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/types.ts#L91)

Function signature for invoking a main-process IPC handler from the renderer.

This is the Electron analog of `TauriInvoke`. It wraps `ipcRenderer.invoke()`
and is exposed on the [ElectronStateSyncBridge](../interfaces/ElectronStateSyncBridge.md) for use by the transport layer.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | The IPC channel name to invoke (must match an `ipcMain.handle()` registration). |
| ...`args` | `unknown`[] | Optional arguments forwarded to the main-process handler. |

## Returns

`Promise`\<`unknown`\>

A promise resolving to the value returned by the main-process handler.
