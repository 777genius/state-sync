[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MemoryStorageBackendOptions

# Interface: MemoryStorageBackendOptions

Defined in: [persistence/src/storage/memory-storage.ts:12](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L12)

Configuration options for the in-memory storage backend.

Provides fine-grained control over simulated behaviors including latency,
error injection, and quota limits. Designed primarily for use in unit tests
and integration tests where a real browser storage API is unavailable or
where deterministic control over storage behavior is required.

## Properties

### errorMessage?

```ts
optional errorMessage: string;
```

Defined in: [persistence/src/storage/memory-storage.ts:59](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L59)

Custom error message used when [failOnSave](#failonsave) or [failOnLoad](#failonload) is enabled.

#### Default

```ts
'Simulated storage error'
```

***

### failOnLoad?

```ts
optional failOnLoad: boolean;
```

Defined in: [persistence/src/storage/memory-storage.ts:52](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L52)

When `true`, all load operations will throw an error with the configured
[errorMessage](#errormessage).

Useful for testing graceful degradation when stored data cannot be retrieved.

#### Default

```ts
false
```

***

### failOnSave?

```ts
optional failOnSave: boolean;
```

Defined in: [persistence/src/storage/memory-storage.ts:42](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L42)

When `true`, all save operations will throw an error with the configured
[errorMessage](#errormessage).

Useful for testing error handling and retry logic in persistence layers.

#### Default

```ts
false
```

***

### initialSnapshot?

```ts
optional initialSnapshot: SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/storage/memory-storage.ts:20](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L20)

An initial snapshot to pre-populate the storage with on creation.

When provided, the storage will behave as if a save had already occurred
with this snapshot. Default metadata (current timestamp, schema version 1,
uncompressed) is generated automatically.

***

### latencyMs?

```ts
optional latencyMs: number;
```

Defined in: [persistence/src/storage/memory-storage.ts:32](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L32)

Simulated latency in milliseconds applied to every storage operation.

When set to a positive value, all `save`, `load`, `clear`, `saveWithMetadata`,
and `loadWithMetadata` operations will be delayed by this duration before
executing. Useful for testing loading states, race conditions, and timeout
handling in consuming code.

#### Default

```ts
0
```

***

### maxSizeBytes?

```ts
optional maxSizeBytes: number;
```

Defined in: [persistence/src/storage/memory-storage.ts:68](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/memory-storage.ts#L68)

Maximum allowed storage size in bytes, simulating a storage quota.

When set, save operations will throw an error if the serialized snapshot
size exceeds this limit, mimicking the `QuotaExceededError` behavior
of browser storage APIs.
