[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createConsoleLogger

# Function: createConsoleLogger()

```ts
function createConsoleLogger(options): Logger;
```

Defined in: [logger.ts:22](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/core/src/logger.ts#L22)

Creates a Logger backed by console.* with an optional prefix.

This is intentionally tiny DX sugar so users can get useful logs without
wiring a full logging system.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsoleLoggerOptions`](../interfaces/ConsoleLoggerOptions.md) |

## Returns

[`Logger`](../interfaces/Logger.md)
