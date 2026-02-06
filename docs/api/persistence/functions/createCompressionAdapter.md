[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createCompressionAdapter

# Function: createCompressionAdapter()

```ts
function createCompressionAdapter(options): CompressionAdapter;
```

Defined in: [persistence/src/compression.ts:212](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/compression.ts#L212)

Creates a compression adapter using any compatible library.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) |

## Returns

[`CompressionAdapter`](../interfaces/CompressionAdapter.md)

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
