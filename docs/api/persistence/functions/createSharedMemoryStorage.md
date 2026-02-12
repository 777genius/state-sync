[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSharedMemoryStorage

# Function: createSharedMemoryStorage()

```ts
function createSharedMemoryStorage<T>(): object;
```

Defined in: [persistence/src/storage/memory-storage.ts:370](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/memory-storage.ts#L370)

Creates a shared in-memory storage registry that can be used to simulate
multiple components or persistence layers sharing a common storage medium.

Each call to getBackend returns a [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md)
instance scoped to the given key, but all backends share the same underlying
`Map` store. This models the behavior of browser storage APIs where multiple
parts of an application can read/write to the same storage under different keys.

Useful for integration tests that verify cross-component persistence behavior,
such as one component saving state and another loading it.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the state data stored within snapshot envelopes. |

## Returns

An object with methods to obtain keyed storage backends and clear all data.

### clearAll()

```ts
clearAll(): void;
```

Clears all data across every key in the shared storage.

Useful for cleanup in test `afterEach` or `afterAll` hooks to ensure
test isolation.

#### Returns

`void`

### getBackend()

```ts
getBackend(key): StorageBackendWithMetadata<T>;
```

Returns a [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) instance scoped to the given key.

Multiple calls with the same key return backends that share the same data,
simulating shared access to a single storage entry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | A unique string key identifying this storage entry. |

#### Returns

[`StorageBackendWithMetadata`](../interfaces/StorageBackendWithMetadata.md)\<`T`\>

A storage backend instance scoped to the specified key.

## Example

```typescript
const shared = createSharedMemoryStorage<MyState>();

const backendA = shared.getBackend('component-a');
const backendB = shared.getBackend('component-b');

await backendA.save({ revision: '1', data: { count: 1 } });
await backendB.save({ revision: '1', data: { count: 2 } });

// Each backend has its own isolated key
const snapshotA = await backendA.load();
const snapshotB = await backendB.load();

// Clear all shared data at once
shared.clearAll();
```
