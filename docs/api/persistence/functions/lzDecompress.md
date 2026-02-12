[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / lzDecompress

# Function: lzDecompress()

```ts
function lzDecompress(compressed): string;
```

Defined in: [persistence/src/compression.ts:86](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L86)

Decompress a string that was previously compressed with [lzCompress](lzCompress.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `compressed` | `string` | The compressed string to decompress. Returns an empty string if input is falsy. |

## Returns

`string`

The original uncompressed string.

## Throws

If the compressed data is invalid or corrupt.

## Example

```typescript
const original = lzDecompress(compressed);
```
