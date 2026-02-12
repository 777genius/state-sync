[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createBase64Adapter

# Function: createBase64Adapter()

```ts
function createBase64Adapter(): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:278](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L278)

Creates a [CompressionAdapter](../interfaces/CompressionAdapter.md) that encodes data as Base64.

This **increases** data size (approximately 33% larger) but produces
human-readable output that is useful for debugging and inspection.
Handles Unicode strings correctly via `TextEncoder`/`TextDecoder`.

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

A compression adapter with algorithm name `'base64'`.
