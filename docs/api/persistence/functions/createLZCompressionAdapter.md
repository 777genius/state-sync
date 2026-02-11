[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLZCompressionAdapter

# Function: createLZCompressionAdapter()

```ts
function createLZCompressionAdapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:162](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/compression.ts#L162)

Creates a compression adapter using built-in LZ compression.

Typically achieves 40-70% compression on JSON data.
No external dependencies required.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

## Example

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  compression: createLZCompressionAdapter(),
});
```
