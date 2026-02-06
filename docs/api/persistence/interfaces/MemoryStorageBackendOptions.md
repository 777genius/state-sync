[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MemoryStorageBackendOptions

# Interface: MemoryStorageBackendOptions

Defined in: [persistence/src/storage/memory-storage.ts:7](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L7)

Options for in-memory storage backend.

## Properties

### errorMessage?

```ts
optional errorMessage: string;
```

Defined in: [persistence/src/storage/memory-storage.ts:31](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L31)

Custom error message for failures.

***

### failOnLoad?

```ts
optional failOnLoad: boolean;
```

Defined in: [persistence/src/storage/memory-storage.ts:26](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L26)

If true, throws an error on load (for testing error handling).

***

### failOnSave?

```ts
optional failOnSave: boolean;
```

Defined in: [persistence/src/storage/memory-storage.ts:21](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L21)

If true, throws an error on save (for testing error handling).

***

### initialSnapshot?

```ts
optional initialSnapshot: SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/storage/memory-storage.ts:11](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L11)

Initial snapshot to pre-populate storage.

***

### latencyMs?

```ts
optional latencyMs: number;
```

Defined in: [persistence/src/storage/memory-storage.ts:16](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L16)

Simulated latency in ms (for testing async behavior).

***

### maxSizeBytes?

```ts
optional maxSizeBytes: number;
```

Defined in: [persistence/src/storage/memory-storage.ts:36](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/memory-storage.ts#L36)

Maximum storage size in bytes (simulates quota).
