[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / withRetryReporting

# Function: withRetryReporting()

```ts
function withRetryReporting<T>(provider, options): SnapshotProvider<T>;
```

Defined in: [retry.ts:224](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L224)

Wraps a [SnapshotProvider](../interfaces/SnapshotProvider.md) with retries and reports each intermediate
retry attempt via the provided logger and/or `onError` callback.

This is a convenience wrapper around [withRetry](withRetry.md) that integrates with
the state-sync error reporting pipeline. On each retry attempt, it:
1. Logs a `warn`-level message via the logger (if provided).
2. Calls the `onError` hook (if provided) with a [SyncErrorContext](../interfaces/SyncErrorContext.md).

The **final** failure (when all retries are exhausted) is still thrown and
will be caught by the sync engine, which emits its own `getSnapshot` error.
This wrapper provides visibility into the intermediate retry attempts only.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The snapshot data type carried inside the [SnapshotEnvelope](../interfaces/SnapshotEnvelope.md). |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\> | The original snapshot provider to wrap with retry and reporting logic. |
| `options` | [`RetryReportingOptions`](../interfaces/RetryReportingOptions.md) | Configuration for retry behavior, logging, and error hooks. |

## Returns

[`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\>

A new [SnapshotProvider](../interfaces/SnapshotProvider.md) with retry and reporting behavior.

## Throws

The last error from the provider if all retry attempts are exhausted.

## Example

```ts
import { withRetryReporting } from '@statesync/core';

const provider = withRetryReporting(originalProvider, {
  topic: 'user-profile',
  policy: { maxAttempts: 5 },
  logger: consoleLogger,
  onError: (ctx) => metrics.increment('sync.retry', { topic: ctx.topic }),
});
```
