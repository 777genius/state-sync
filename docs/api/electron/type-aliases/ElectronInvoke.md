[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvoke

# Type Alias: ElectronInvoke()

```ts
type ElectronInvoke = (channel, ...args) => Promise<unknown>;
```

Defined in: [types.ts:28](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L28)

Function that invokes a main-process handler.
Analog of TauriInvoke.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

## Returns

`Promise`\<`unknown`\>
