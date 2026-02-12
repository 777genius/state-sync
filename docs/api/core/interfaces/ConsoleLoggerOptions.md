[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / ConsoleLoggerOptions

# Interface: ConsoleLoggerOptions

Defined in: [logger.ts:18](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/logger.ts#L18)

Configuration options for the console-based logger created by
[createConsoleLogger](../functions/createConsoleLogger.md).

## Properties

### debug?

```ts
optional debug: boolean;
```

Defined in: [logger.ts:36](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/logger.ts#L36)

Whether `debug()`-level messages are emitted.

When `false`, calls to `debug()` are silently dropped (no-op).
Set to `true` during development or troubleshooting to see verbose sync output.

#### Default Value

`false`

***

### prefix?

```ts
optional prefix: string;
```

Defined in: [logger.ts:26](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/logger.ts#L26)

A string prefix prepended to every log message.

Useful for distinguishing state-sync logs from other console output.

#### Default Value

`"[state-sync]"`
