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

Defined in: [retry.ts:36](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L36)

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
