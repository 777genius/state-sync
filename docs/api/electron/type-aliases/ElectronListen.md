[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronListen

# Type Alias: ElectronListen()

```ts
type ElectronListen = (channel, handler) => () => void;
```

Defined in: [types.ts:22](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L22)

Function that subscribes to IPC events and returns unsubscribe.
The unsubscribe pattern solves contextBridge's broken callback identity.

Analog of TauriListen, but sync return (not Promise of Unsubscribe).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| `handler` | (...`args`) => `void` |

## Returns

```ts
(): void;
```

### Returns

`void`
