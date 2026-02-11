[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSharedMemoryStorage

# Function: createSharedMemoryStorage()

```ts
function createSharedMemoryStorage<T>(): object;
```

Defined in: [persistence/src/storage/memory-storage.ts:241](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/storage/memory-storage.ts#L241)

Creates a shared memory storage that can be used across multiple tests.
Useful for simulating shared storage between components.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Returns

`object`

### clearAll()

```ts
clearAll(): void;
```

#### Returns

`void`

### getBackend()

```ts
getBackend(key): StorageBackendWithMetadata<T>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

[`StorageBackendWithMetadata`](../interfaces/StorageBackendWithMetadata.md)\<`T`\>
