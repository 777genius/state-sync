[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RetryReportingOptions

# Interface: RetryReportingOptions

Defined in: [retry.ts:159](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/retry.ts#L159)

Options for [withRetryReporting](../functions/withRetryReporting.md), which combines retry logic
with structured logging and error reporting.

## Properties

### logger?

```ts
optional logger: Logger;
```

Defined in: [retry.ts:174](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/retry.ts#L174)

Logger instance for emitting structured retry warnings.
When provided, a `warn`-level message is logged for each retry attempt.

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [retry.ts:188](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/retry.ts#L188)

Optional error hook invoked on each retry attempt.

The callback receives a [SyncErrorContext](SyncErrorContext.md) with:
- `phase` set to `'getSnapshot'`
- `willRetry` set to `true`
- `attempt` indicating which retry this is (1-based)
- `nextDelayMs` indicating the backoff delay before the next attempt

If this callback itself throws, the error is caught and logged
(it does not affect the retry flow).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`SyncErrorContext`](SyncErrorContext.md) |

#### Returns

`void`

***

### policy?

```ts
optional policy: RetryPolicy;
```

Defined in: [retry.ts:168](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/retry.ts#L168)

Retry policy configuration. When omitted, the default [RetryPolicy](RetryPolicy.md) values are used.

***

### topic

```ts
topic: string;
```

Defined in: [retry.ts:163](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/retry.ts#L163)

The topic associated with this provider, used for log context and error reporting.
