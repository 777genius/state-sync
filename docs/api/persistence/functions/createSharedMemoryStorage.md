[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSharedMemoryStorage

# Function: createSharedMemoryStorage()

```ts
function createSharedMemoryStorage<T>(): object;
```

Defined in: [persistence/src/storage/memory-storage.ts:241](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/persistence/src/storage/memory-storage.ts#L241)

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
