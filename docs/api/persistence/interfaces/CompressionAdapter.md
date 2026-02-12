[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CompressionAdapter

# Interface: CompressionAdapter

Defined in: [persistence/src/types.ts:280](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L280)

Adapter for compressing and decompressing serialized snapshot data.

Compression is applied **after** JSON serialization and **before** writing to storage,
reducing the size of persisted data. The same adapter must be used for both
compression and decompression; mismatched adapters will produce corrupt data.

Built-in adapters: [createLZCompressionAdapter](../functions/createLZCompressionAdapter.md), [createLZStringAdapter](../functions/createLZStringAdapter.md),
[createNoCompressionAdapter](../functions/createNoCompressionAdapter.md), [createBase64Adapter](../functions/createBase64Adapter.md).

## Example

```typescript
const adapter: CompressionAdapter = {
  algorithm: 'custom-lz',
  compress: (data) => myCompress(data),
  decompress: (data) => myDecompress(data),
};
```

## Properties

### algorithm

```ts
readonly algorithm: string;
```

Defined in: [persistence/src/types.ts:302](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L302)

Human-readable name of the compression algorithm (e.g., `'lz'`, `'lz-string'`, `'none'`).

Used for logging and diagnostics.

## Methods

### compress()

```ts
compress(data): string;
```

Defined in: [persistence/src/types.ts:287](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L287)

Compress a serialized JSON string into a shorter representation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The raw JSON string to compress. |

#### Returns

`string`

The compressed string, safe for storage in the target backend.

***

### decompress()

```ts
decompress(data): string;
```

Defined in: [persistence/src/types.ts:295](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L295)

Decompress a string previously produced by [compress](#compress).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The compressed string to decompress. |

#### Returns

`string`

The original JSON string.
