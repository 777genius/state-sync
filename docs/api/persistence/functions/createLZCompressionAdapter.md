[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLZCompressionAdapter

# Function: createLZCompressionAdapter()

```ts
function createLZCompressionAdapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:187](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/compression.ts#L187)

Creates a [CompressionAdapter](../interfaces/CompressionAdapter.md) using the built-in LZW compression.

This is a zero-dependency adapter that typically achieves 40-70% compression
on JSON data. Suitable for most use cases where external libraries are undesirable.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

A compression adapter with algorithm name `'lz'`.

## Example

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  compression: createLZCompressionAdapter(),
});
```
