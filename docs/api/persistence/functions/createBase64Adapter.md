[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createBase64Adapter

# Function: createBase64Adapter()

```ts
function createBase64Adapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:232](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/compression.ts#L232)

Base64 adapter for debugging (increases size but makes data readable).
Handles Unicode properly.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)
