[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronBridge

# Function: createElectronBridge()

```ts
function createElectronBridge(ipcRenderer): ElectronStateSyncBridge;
```

Defined in: [preload.ts:23](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/preload.ts#L23)

Creates an ElectronStateSyncBridge from an ipcRenderer-like object.

WHY THIS EXISTS: contextBridge does NOT preserve callback identity.
Each function crossing the bridge gets a new proxy. This breaks
ipcRenderer.removeListener() because the callback reference differs.

This bridge solves it by returning an unsubscribe closure from on(),
which captures the EXACT listener reference in preload scope.

SECURITY: The bridge exposes on() and invoke() for arbitrary channels.
Only expose it via contextBridge for your state-sync channels.
Do not combine with other ipcMain.handle() registrations that
perform privileged operations without additional channel validation.

Usage in preload.ts:
  const { contextBridge, ipcRenderer } = require('electron');
  const { createElectronBridge } = require('@statesync/electron');
  contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ipcRenderer` | [`ElectronIpcRendererLike`](../interfaces/ElectronIpcRendererLike.md) |

## Returns

[`ElectronStateSyncBridge`](../interfaces/ElectronStateSyncBridge.md)
