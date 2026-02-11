[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronInvoke

# Type Alias: ElectronInvoke()

```ts
type ElectronInvoke = (channel, ...args) => Promise<unknown>;
```

Defined in: types.ts:28

Function that invokes a main-process handler.
Analog of TauriInvoke.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

## Returns

`Promise`\<`unknown`\>
