[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createMemoryStorageBackend

# Function: createMemoryStorageBackend()

```ts
function createMemoryStorageBackend<T>(options): StorageBackendWithMetadata<T> & object;
```

Defined in: [persistence/src/storage/memory-storage.ts:147](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/memory-storage.ts#L147)

Creates an in-memory [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) primarily intended for
testing purposes.

This backend stores snapshots entirely in memory with no external dependencies
or browser API requirements, making it ideal for unit tests, integration tests,
and environments where browser storage is unavailable (e.g., Node.js, SSR).

The returned object extends the standard [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) interface
with additional testing utilities for inspecting internal state, resetting storage,
and dynamically toggling error injection.

**Key features:**
- Zero external dependencies -- works in any JavaScript runtime
- Configurable latency simulation for testing async/loading behavior
- Error injection for testing error handling and retry logic
- Quota simulation for testing storage limit scenarios
- Full metadata support matching the IndexedDB backend contract
- Snapshot history tracking for assertion in tests

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the state data stored within snapshot envelopes. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`MemoryStorageBackendOptions`](../interfaces/MemoryStorageBackendOptions.md) | Configuration options for the memory backend. All options are optional; the default configuration creates a simple, zero-latency, no-failure in-memory store. |

## Returns

A [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) instance with additional testing
  utilities: getSavedSnapshots, getRawData, reset, and
  setFailMode.

## Throws

Throws with the configured error message when [failOnSave](../interfaces/MemoryStorageBackendOptions.md#failonsave)
  is enabled and a save operation is attempted.

## Throws

Throws with the configured error message when [failOnLoad](../interfaces/MemoryStorageBackendOptions.md#failonload)
  is enabled and a load operation is attempted.

## Throws

Throws when the serialized snapshot exceeds
  [maxSizeBytes](../interfaces/MemoryStorageBackendOptions.md#maxsizebytes) during a save operation.

## Examples

```typescript
const storage = createMemoryStorageBackend<MyState>();

await storage.save({ revision: '1', data: { count: 42 } });
const snapshot = await storage.load();
expect(snapshot?.data.count).toBe(42);
```

```typescript
const storage = createMemoryStorageBackend<MyState>({ latencyMs: 100 });
// Each operation will be delayed by 100ms
```

```typescript
const storage = createMemoryStorageBackend<MyState>({
  failOnSave: true,
  errorMessage: 'Disk full',
});

await expect(storage.save(snapshot)).rejects.toThrow('Disk full');

// Toggle failure mode dynamically
storage.setFailMode({ save: false });
await storage.save(snapshot); // succeeds now
```

```typescript
const storage = createMemoryStorageBackend<MyState>({
  initialSnapshot: { revision: '1', data: { count: 0 } },
  maxSizeBytes: 1024,
});

const snapshot = await storage.load();
expect(snapshot).not.toBeNull();
```
