[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / benchmarkCompression

# Function: benchmarkCompression()

```ts
function benchmarkCompression(
   data, 
   adapter, 
   iterations): object;
```

Defined in: [persistence/src/compression.ts:271](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/compression.ts#L271)

Benchmark compression performance.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `data` | `string` | `undefined` |
| `adapter` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) | `undefined` |
| `iterations` | `number` | `100` |

## Returns

`object`

Object with compression ratio, compress time, decompress time

### compressedSize

```ts
compressedSize: number;
```

### compressTimeMs

```ts
compressTimeMs: number;
```

### decompressTimeMs

```ts
decompressTimeMs: number;
```

### originalSize

```ts
originalSize: number;
```

### ratio

```ts
ratio: number;
```
