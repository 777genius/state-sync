[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcMainHandle

# Type Alias: ElectronIpcMainHandle()

```ts
type ElectronIpcMainHandle = (channel, listener) => void;
```

Defined in: [types.ts:53](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/types.ts#L53)

Structural type for ipcMain.handle.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| `listener` | (`event`, ...`args`) => `unknown` |

## Returns

`void`
