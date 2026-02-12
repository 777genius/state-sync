[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronSnapshotHandler

# Function: createElectronSnapshotHandler()

```ts
function createElectronSnapshotHandler<T>(options): ElectronSnapshotHandlerHandle;
```

Defined in: [main.ts:242](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L242)

Registers an `ipcMain.handle()` listener that serves SnapshotEnvelope
responses to renderer processes requesting the current snapshot.

When a renderer calls `ipcRenderer.invoke(channel)`, the registered
[ElectronSnapshotHandlerOptions.getSnapshot](../interfaces/ElectronSnapshotHandlerOptions.md#getsnapshot) callback is invoked,
and its result is returned as the IPC response.

**Process context:** main process only.

Errors thrown by `getSnapshot` are logged to `console.error` and re-thrown
so they propagate as IPC rejection to the renderer.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ElectronSnapshotHandlerOptions`](../interfaces/ElectronSnapshotHandlerOptions.md)\<`T`\> | Configuration for the snapshot handler. |

## Returns

[`ElectronSnapshotHandlerHandle`](../interfaces/ElectronSnapshotHandlerHandle.md)

A disposable handle. Call [ElectronSnapshotHandlerHandle.dispose](../interfaces/ElectronSnapshotHandlerHandle.md#dispose)
  to unregister the IPC handler.

## Example

```ts
import { ipcMain } from 'electron';
import { createElectronSnapshotHandler } from '@statesync/electron';

const handler = createElectronSnapshotHandler({
  topic: 'todos',
  getSnapshot: async () => ({
    revision: '42' as Revision,
    data: await db.getAllTodos(),
  }),
  handle: ipcMain.handle.bind(ipcMain),
  removeHandler: ipcMain.removeHandler.bind(ipcMain),
});

// On app quit:
handler.dispose();
```
