[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / createElectronBroadcaster

# Function: createElectronBroadcaster()

```ts
function createElectronBroadcaster(options): ElectronBroadcasterHandle;
```

Defined in: [main.ts:37](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L37)

Creates a broadcaster for invalidation events.

Safety: iterates targets with try/catch + isDestroyed() guard.
Destroyed webContents between check and send() is a real
TOCTOU race in Electron multi-window apps — the try/catch handles it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ElectronBroadcasterOptions`](../interfaces/ElectronBroadcasterOptions.md) |

## Returns

[`ElectronBroadcasterHandle`](../interfaces/ElectronBroadcasterHandle.md)
