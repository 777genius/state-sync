[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLZStringAdapter

# Function: createLZStringAdapter()

```ts
function createLZStringAdapter(lzString): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:214](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L214)

Creates a [CompressionAdapter](../interfaces/CompressionAdapter.md) backed by the external `lz-string` library.

Offers better compression ratios than the built-in adapter but requires
`lz-string` as a peer dependency. Uses UTF-16 encoding for localStorage safety.

Install: `pnpm add lz-string`

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lzString` | \{ `compressToUTF16`: (`input`) => `string`; `decompressFromUTF16`: (`input`) => `string` \| `null`; \} | The `lz-string` module or an object with compatible `compressToUTF16` and `decompressFromUTF16` methods. |
| `lzString.compressToUTF16` | (`input`) => `string` | - |
| `lzString.decompressFromUTF16` | (`input`) => `string` \| `null` | - |

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

A compression adapter with algorithm name `'lz-string'`.

## Example

```typescript
import LZString from 'lz-string';

const compression = createLZStringAdapter(LZString);
```
