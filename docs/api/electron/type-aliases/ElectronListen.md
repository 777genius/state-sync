[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronListen

# Type Alias: ElectronListen()

```ts
type ElectronListen = (channel, handler) => () => void;
```

Defined in: types.ts:22

Function that subscribes to IPC events and returns unsubscribe.
The unsubscribe pattern solves contextBridge's broken callback identity.

Analog of TauriListen, but sync return (not `Promise<Unsubscribe>`).

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
