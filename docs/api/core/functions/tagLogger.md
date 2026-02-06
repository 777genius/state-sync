[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / tagLogger

# Function: tagLogger()

```ts
function tagLogger(base, tags): Logger;
```

Defined in: [logger.ts:64](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/logger.ts#L64)

Adds static tags to every log call (useful for windowId/sourceId, etc).

This is intentionally small DX sugar: it does not change log levels or format,
it only enriches the `extra` payload.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `base` | [`Logger`](../interfaces/Logger.md) |
| `tags` | `Record`\<`string`, `unknown`\> |

## Returns

[`Logger`](../interfaces/Logger.md)
