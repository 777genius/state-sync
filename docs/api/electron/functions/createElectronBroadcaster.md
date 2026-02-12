[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronBroadcaster

# Function: createElectronBroadcaster()

```ts
function createElectronBroadcaster(options): ElectronBroadcasterHandle;
```

Defined in: [main.ts:104](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L104)

Creates a broadcaster that pushes InvalidationEvent payloads to
renderer windows over Electron IPC.

Call [ElectronBroadcasterHandle.invalidate](../interfaces/ElectronBroadcasterHandle.md#invalidate) whenever the authoritative
state changes (e.g. after a database write) to notify all connected renderers
that their cached data is stale.

**Process context:** main process only.

**Safety:** Iterates targets with `try/catch` + `isDestroyed()` guard.
The TOCTOU race (webContents destroyed between check and `send()`) is a real
scenario in Electron multi-window apps — the `try/catch` handles it gracefully.
Non-TOCTOU errors are logged to `console.warn` so they are not silently lost.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ElectronBroadcasterOptions`](../interfaces/ElectronBroadcasterOptions.md) | Configuration for the broadcaster. |

## Returns

[`ElectronBroadcasterHandle`](../interfaces/ElectronBroadcasterHandle.md)

A handle with an [ElectronBroadcasterHandle.invalidate](../interfaces/ElectronBroadcasterHandle.md#invalidate) method.

## Example

```ts
import { BrowserWindow } from 'electron';
import { createElectronBroadcaster } from '@statesync/electron';

const broadcaster = createElectronBroadcaster({
  topic: 'todos',
  getTargets: () => BrowserWindow.getAllWindows().map(w => w.webContents),
});

// After a database write:
broadcaster.invalidate('42', { sourceId: 'api-handler' });
```
