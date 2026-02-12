[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / tagLogger

# Function: tagLogger()

```ts
function tagLogger(base, tags): Logger;
```

Defined in: [logger.ts:148](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/logger.ts#L148)

Wraps an existing [Logger](../interfaces/Logger.md) to inject static key-value tags into every log call.

The tags are merged into the `extra` payload of each `debug`, `warn`, and `error`
call. If the original `extra` argument is a plain object, tags and extra are
shallow-merged (with `extra` fields taking precedence). If `extra` is a
non-object value, it is wrapped as `{ ...tags, extra: value }`.

This is intentionally minimal: it does not change log levels, formatting, or
the base logger's behavior. It only enriches the structured metadata.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base` | [`Logger`](../interfaces/Logger.md) | The logger instance to wrap. All calls are delegated to this logger. |
| `tags` | `Record`\<`string`, `unknown`\> | A record of key-value pairs to inject into every log call's `extra` payload. Common use cases include `windowId`, `sourceId`, or `sessionId`. |

## Returns

[`Logger`](../interfaces/Logger.md)

A new [Logger](../interfaces/Logger.md) that delegates to `base` with enriched `extra` payloads.

## Example

```ts
import { createConsoleLogger, tagLogger } from '@statesync/core';

const baseLogger = createConsoleLogger({ debug: true });
const logger = tagLogger(baseLogger, {
  windowId: 'win-1',
  sourceId: 'tab-abc',
});

logger.debug('snapshot applied', { revision: '42' });
// Console output includes: { windowId: 'win-1', sourceId: 'tab-abc', revision: '42' }
```
