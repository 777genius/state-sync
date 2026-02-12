[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / lzDecompress

# Function: lzDecompress()

```ts
function lzDecompress(compressed): string;
```

Defined in: [persistence/src/compression.ts:86](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/compression.ts#L86)

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
