[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcMainHandle

# Type Alias: ElectronIpcMainHandle()

```ts
type ElectronIpcMainHandle = (channel, listener) => void;
```

Defined in: types.ts:53

Structural type for ipcMain.handle.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| `listener` | (`event`, ...`args`) => `unknown` |

## Returns

`void`
