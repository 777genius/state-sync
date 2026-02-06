[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CompressionAdapter

# Interface: CompressionAdapter

Defined in: [persistence/src/types.ts:155](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L155)

Compression adapter for reducing storage size.

## Properties

### algorithm

```ts
readonly algorithm: string;
```

Defined in: [persistence/src/types.ts:169](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L169)

Name of compression algorithm.

## Methods

### compress()

```ts
compress(data): string;
```

Defined in: [persistence/src/types.ts:159](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L159)

Compress a string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |

#### Returns

`string`

***

### decompress()

```ts
decompress(data): string;
```

Defined in: [persistence/src/types.ts:164](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L164)

Decompress a string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |

#### Returns

`string`
