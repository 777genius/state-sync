[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createConsoleLogger

# Function: createConsoleLogger()

```ts
function createConsoleLogger(options): Logger;
```

Defined in: [logger.ts:22](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/core/src/logger.ts#L22)

Creates a Logger backed by console.* with an optional prefix.

This is intentionally tiny DX sugar so users can get useful logs without
wiring a full logging system.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsoleLoggerOptions`](../interfaces/ConsoleLoggerOptions.md) |

## Returns

[`Logger`](../interfaces/Logger.md)
