[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLZStringAdapter

# Function: createLZStringAdapter()

```ts
function createLZStringAdapter(lzString): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:184](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/compression.ts#L184)

Creates a compression adapter using external lz-string library.

Better compression ratio than built-in, but requires external dependency.

Install: `pnpm add lz-string`

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lzString` | \{ `compressToUTF16`: (`input`) => `string`; `decompressFromUTF16`: (`input`) => `string` \| `null`; \} |
| `lzString.compressToUTF16` | (`input`) => `string` |
| `lzString.decompressFromUTF16` | (`input`) => `string` \| `null` |

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

## Example

```typescript
import LZString from 'lz-string';

const compression = createLZStringAdapter(LZString);
```
