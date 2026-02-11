[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronBridge

# Function: createElectronBridge()

```ts
function createElectronBridge(ipcRenderer): ElectronStateSyncBridge;
```

Defined in: preload.ts:18

Creates an ElectronStateSyncBridge from an ipcRenderer-like object.

WHY THIS EXISTS: contextBridge does NOT preserve callback identity.
Each function crossing the bridge gets a new proxy. This breaks
ipcRenderer.removeListener() because the callback reference differs.

This bridge solves it by returning an unsubscribe closure from on(),
which captures the EXACT listener reference in preload scope.

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
