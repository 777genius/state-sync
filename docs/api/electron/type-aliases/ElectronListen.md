[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronListen

# Type Alias: ElectronListen()

```ts
type ElectronListen = (channel, handler) => () => void;
```

Defined in: [types.ts:22](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/types.ts#L22)

Function that subscribes to IPC events and returns unsubscribe.
The unsubscribe pattern solves contextBridge's broken callback identity.

Analog of TauriListen, but sync return (not Promise<Unsubscribe>).

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
