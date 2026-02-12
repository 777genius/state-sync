[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronBridge

# Function: createElectronBridge()

```ts
function createElectronBridge(ipcRenderer): ElectronStateSyncBridge;
```

Defined in: [preload.ts:61](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/preload.ts#L61)

Creates an [ElectronStateSyncBridge](../interfaces/ElectronStateSyncBridge.md) from an `ipcRenderer`-like object.

**Why this exists:** Electron's `contextBridge` does not preserve callback
identity — each function crossing the bridge gets a new proxy wrapper.
This breaks `ipcRenderer.removeListener()` because the callback reference
stored in the main world differs from the one registered in the preload world.

This bridge solves the problem by returning an **unsubscribe closure** from
`on()`, which captures the exact listener reference in the preload scope.
The renderer calls the unsubscribe function instead of `removeListener()`.

**Security considerations:**
- The bridge exposes `on()` and `invoke()` for **arbitrary channel names**.
- Only expose it via `contextBridge.exposeInMainWorld()` for state-sync channels.
- Do not combine this bridge with `ipcMain.handle()` registrations that
  perform privileged operations without additional channel-name validation.
- For maximum security, consider wrapping the bridge to whitelist specific channels.

**Process context:** preload script (runs in a Node.js context with `contextIsolation`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ipcRenderer` | [`ElectronIpcRendererLike`](../interfaces/ElectronIpcRendererLike.md) | The Electron `ipcRenderer` object or any compatible mock. See [ElectronIpcRendererLike](../interfaces/ElectronIpcRendererLike.md) for the required interface. |

## Returns

[`ElectronStateSyncBridge`](../interfaces/ElectronStateSyncBridge.md)

A bridge object safe to pass to `contextBridge.exposeInMainWorld()`.

## Examples

```ts
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { createElectronBridge } from '@statesync/electron';

contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
```

```ts
// renderer.ts — consuming the bridge
import type { ElectronStateSyncBridge } from '@statesync/electron';

const bridge = (window as any).statesync as ElectronStateSyncBridge;
const unsubscribe = bridge.on('statesync:todos:invalidated', (event) => {
  console.log('Got invalidation:', event);
});

// Later:
unsubscribe();
```
