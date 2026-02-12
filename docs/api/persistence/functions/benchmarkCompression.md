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

Defined in: [persistence/src/compression.ts:346](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/compression.ts#L346)

Benchmarks a compression adapter's performance by running multiple iterations.

Performs a warm-up pass before measuring, then runs `iterations` rounds each
of compress and decompress to compute average timings.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `data` | `string` | `undefined` | The input string to use for benchmarking. |
| `adapter` | [`CompressionAdapter`](../interfaces/CompressionAdapter.md) | `undefined` | The compression adapter to benchmark. |
| `iterations` | `number` | `100` | Number of iterations for each operation. Higher values produce more stable results but take longer. |

## Returns

`object`

An object containing:
  - `ratio` -- compressed size / original size (lower is better)
  - `compressTimeMs` -- average compress time per iteration in milliseconds
  - `decompressTimeMs` -- average decompress time per iteration in milliseconds
  - `originalSize` -- length of the input string in characters
  - `compressedSize` -- length of the compressed string in characters

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

## Example

```typescript
const result = benchmarkCompression(largeJson, createLZCompressionAdapter(), 200);
console.log(`Ratio: ${result.ratio}, Compress: ${result.compressTimeMs}ms`);
```
