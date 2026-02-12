[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createConsoleLogger

# Function: createConsoleLogger()

```ts
function createConsoleLogger(options): Logger;
```

Defined in: [logger.ts:68](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/logger.ts#L68)

Creates a [Logger](../interfaces/Logger.md) implementation backed by `console.debug`, `console.warn`,
and `console.error`.

This is intentionally minimal DX sugar so users can get structured logs without
wiring a full logging framework. Each log call prepends the configured prefix
and passes the optional `extra` payload as a second argument to the console method.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ConsoleLoggerOptions`](../interfaces/ConsoleLoggerOptions.md) | Optional configuration for prefix and debug verbosity. Defaults to prefix `"[state-sync]"` and debug disabled. |

## Returns

[`Logger`](../interfaces/Logger.md)

A [Logger](../interfaces/Logger.md) instance that delegates to the global `console` object.

## Example

```ts
import { createConsoleLogger } from '@statesync/core';

// Basic usage with defaults
const logger = createConsoleLogger();

// Custom prefix and debug enabled
const verboseLogger = createConsoleLogger({
  prefix: '[my-app/sync]',
  debug: true,
});

verboseLogger.debug('snapshot fetched', { revision: '42' });
// Console output: [my-app/sync] snapshot fetched { revision: '42' }
```
