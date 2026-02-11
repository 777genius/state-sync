[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / estimateCompressionRatio

# Function: estimateCompressionRatio()

```ts
function estimateCompressionRatio(data, adapter): number;
```

Defined in: [persistence/src/compression.ts:260](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/persistence/src/compression.ts#L260)

Estimates compression ratio for given data using a specified adapter.
Returns a value between 0 and 1 (lower is better compression).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |
| `adapter` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) |

## Returns

`number`
