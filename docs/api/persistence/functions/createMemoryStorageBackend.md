[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createMemoryStorageBackend

# Function: createMemoryStorageBackend()

```ts
function createMemoryStorageBackend<T>(options): StorageBackendWithMetadata<T> & object;
```

Defined in: [persistence/src/storage/memory-storage.ts:66](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/storage/memory-storage.ts#L66)

Creates an in-memory StorageBackend for testing.

Features:
- No external dependencies
- Configurable latency simulation
- Error injection for testing
- Quota simulation
- Full metadata support

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryStorageBackendOptions`](../interfaces/MemoryStorageBackendOptions.md) |

## Returns

## Example

```typescript
// Basic usage
const storage = createMemoryStorageBackend();

// With simulated latency
const slowStorage = createMemoryStorageBackend({ latencyMs: 100 });

// With error injection
const failingStorage = createMemoryStorageBackend({ failOnSave: true });

// Pre-populated
const preloadedStorage = createMemoryStorageBackend({
  initialSnapshot: { revision: '1', data: { count: 0 } },
});
```
