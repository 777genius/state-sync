[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / estimateCompressionRatio

# Function: estimateCompressionRatio()

```ts
function estimateCompressionRatio(data, adapter): number;
```

Defined in: [persistence/src/compression.ts:317](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L317)

Estimates the compression ratio of a given string using the specified adapter.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The input string to compress for measurement. Returns `1` if empty. |
| `adapter` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) | The compression adapter to evaluate. |

## Returns

`number`

A ratio where lower values indicate better compression (values above 1
  mean the "compressed" output is larger than the original).
  For example, `0.4` means the compressed output is 40% of the original size.

## Example

```typescript
const ratio = estimateCompressionRatio(jsonString, createLZCompressionAdapter());
console.log(`Compression ratio: ${(ratio * 100).toFixed(1)}%`);
```
