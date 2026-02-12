[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Logger

# Interface: Logger

Defined in: [types.ts:206](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L206)

A minimal structured logging interface used by the sync engine.

Implementations can delegate to `console`, a logging library, or a
telemetry pipeline. The `extra` parameter carries structured context
(topic, revision, error, etc.) and is intentionally `unknown` so that
any serializable data can be passed through.

## See

 - [createConsoleLogger](../functions/createConsoleLogger.md) for a ready-made console-based implementation.
 - [noopLogger](../variables/noopLogger.md) for a silent no-op implementation.
 - [tagLogger](../functions/tagLogger.md) for enriching log calls with static tags.

## Methods

### debug()

```ts
debug(msg, extra?): void;
```

Defined in: [types.ts:213](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L213)

Logs a debug-level message. Typically used for tracing sync lifecycle events.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `msg` | `string` | A human-readable log message. |
| `extra?` | `unknown` | Optional structured context for the log entry. |

#### Returns

`void`

***

### error()

```ts
error(msg, extra?): void;
```

Defined in: [types.ts:227](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L227)

Logs an error-level message. Used for failures in the sync pipeline.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `msg` | `string` | A human-readable log message. |
| `extra?` | `unknown` | Optional structured context for the log entry. |

#### Returns

`void`

***

### warn()

```ts
warn(msg, extra?): void;
```

Defined in: [types.ts:220](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L220)

Logs a warning-level message. Used for non-fatal issues such as retry attempts.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `msg` | `string` | A human-readable log message. |
| `extra?` | `unknown` | Optional structured context for the log entry. |

#### Returns

`void`
