[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / withRetry

# Function: withRetry()

```ts
function withRetry<T>(
   provider, 
   policy?, 
onRetry?): SnapshotProvider<T>;
```

Defined in: [retry.ts:125](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L125)

Wraps a [SnapshotProvider](../interfaces/SnapshotProvider.md) with automatic retries using exponential backoff.

On each failed attempt (except the last), the `onRetry` callback is invoked
before the delay. This can be used for logging, metrics, or to inspect the error.
After all attempts are exhausted, the last error is re-thrown.

The returned provider has the same interface as the original, so it can be used
as a drop-in replacement anywhere a `SnapshotProvider` is expected.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The snapshot data type carried inside the [SnapshotEnvelope](../interfaces/SnapshotEnvelope.md). |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\> | The original snapshot provider to wrap with retry logic. |
| `policy?` | [`RetryPolicy`](../interfaces/RetryPolicy.md) | Optional retry configuration. Uses [RetryPolicy](../interfaces/RetryPolicy.md) defaults when omitted. |
| `onRetry?` | (`info`) => `void` | Optional callback invoked after each failed attempt (before the backoff delay). Receives an object with: - `attempt`: The retry attempt number (1-based; 1 = first retry after initial failure). - `error`: The error thrown by the provider. - `nextDelayMs`: The delay in ms before the next attempt. |

## Returns

[`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\>

A new [SnapshotProvider](../interfaces/SnapshotProvider.md) that retries on failure according to the given policy.

## Throws

The last error from the provider if all attempts are exhausted.

## Example

```ts
import { withRetry } from '@statesync/core';

const resilientProvider = withRetry(
  originalProvider,
  { maxAttempts: 5, initialDelayMs: 1000 },
  ({ attempt, error, nextDelayMs }) => {
    console.warn(`Retry ${attempt}, next delay: ${nextDelayMs}ms`, error);
  },
);
```
