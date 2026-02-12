[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createNoCompressionAdapter

# Function: createNoCompressionAdapter()

```ts
function createNoCompressionAdapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:261](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L261)

Creates a no-op [CompressionAdapter](../interfaces/CompressionAdapter.md) that passes data through unchanged.

Useful for testing, debugging, or when compression overhead is not worth the
storage savings. The algorithm name is `'none'`.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

A compression adapter that performs no compression or decompression.
