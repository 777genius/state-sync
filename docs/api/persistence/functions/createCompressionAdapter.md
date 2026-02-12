[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createCompressionAdapter

# Function: createCompressionAdapter()

```ts
function createCompressionAdapter(options): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:249](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/compression.ts#L249)

Creates a [CompressionAdapter](../interfaces/CompressionAdapter.md) from a user-supplied implementation.

This is a convenience factory for wrapping any compression library that
operates on strings. The returned adapter is the same object passed in --
no wrapping or copying is performed.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) | An object implementing the [CompressionAdapter](../interfaces/CompressionAdapter.md) interface. |

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

The same adapter object, typed as [CompressionAdapter](../interfaces/CompressionAdapter.md).

## Example

```typescript
import pako from 'pako';

const compression = createCompressionAdapter({
  algorithm: 'gzip',
  compress: (data) => btoa(String.fromCharCode(...pako.gzip(data))),
  decompress: (data) => pako.ungzip(
    Uint8Array.from(atob(data), c => c.charCodeAt(0)),
    { to: 'string' }
  ),
});
```
