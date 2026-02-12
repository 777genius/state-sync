[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createNoCompressionAdapter

# Function: createNoCompressionAdapter()

```ts
function createNoCompressionAdapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:261](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/compression.ts#L261)

Creates a no-op [CompressionAdapter](../interfaces/CompressionAdapter.md) that passes data through unchanged.

Useful for testing, debugging, or when compression overhead is not worth the
storage savings. The algorithm name is `'none'`.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

A compression adapter that performs no compression or decompression.
