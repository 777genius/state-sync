[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / ConsoleLoggerOptions

# Interface: ConsoleLoggerOptions

Defined in: [logger.ts:3](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/logger.ts#L3)

## Properties

### debug?

```ts
optional debug: boolean;
```

Defined in: [logger.ts:13](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/logger.ts#L13)

If true, debug() logs are emitted. Otherwise debug() is a no-op.
Default: false

***

### prefix?

```ts
optional prefix: string;
```

Defined in: [logger.ts:8](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/logger.ts#L8)

Prefix added to each log line.
Default: "[state-sync]"
