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

Defined in: [retry.ts:36](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/retry.ts#L36)

Wraps a SnapshotProvider with retries using exponential backoff.

On each failed attempt, `onRetry` is called (if provided) — you can use it for
logging or cancellation.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\> |
| `policy?` | [`RetryPolicy`](../interfaces/RetryPolicy.md) |
| `onRetry?` | (`info`) => `void` |

## Returns

[`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\>
