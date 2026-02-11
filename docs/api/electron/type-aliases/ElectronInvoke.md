[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvoke

# Type Alias: ElectronInvoke()

```ts
type ElectronInvoke = (channel, ...args) => Promise<unknown>;
```

Defined in: [types.ts:28](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/types.ts#L28)

Function that invokes a main-process handler.
Analog of TauriInvoke.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

## Returns

`Promise`\<`unknown`\>
