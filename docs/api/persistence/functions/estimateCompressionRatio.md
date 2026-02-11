[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / estimateCompressionRatio

# Function: estimateCompressionRatio()

```ts
function estimateCompressionRatio(data, adapter): number;
```

Defined in: [persistence/src/compression.ts:260](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/compression.ts#L260)

Estimates compression ratio for given data using a specified adapter.
Returns a value between 0 and 1 (lower is better compression).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |
| `adapter` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) |

## Returns

`number`
