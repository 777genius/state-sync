[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / withRetryReporting

# Function: withRetryReporting()

```ts
function withRetryReporting<T>(provider, options): SnapshotProvider<T>;
```

Defined in: [retry.ts:85](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/core/src/retry.ts#L85)

Convenience wrapper: retries a provider and reports retry attempts via logger/onError.

Note: the final failure is still thrown by the provider; the engine will emit its own
`getSnapshot` error on that final failure. This wrapper is mainly for visibility into
intermediate retry attempts.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\> |
| `options` | [`RetryReportingOptions`](../interfaces/RetryReportingOptions.md) |

## Returns

[`SnapshotProvider`](../interfaces/SnapshotProvider.md)\<`T`\>
