[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshotMetadata

# Interface: PersistedSnapshotMetadata

Defined in: [persistence/src/types.ts:44](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L44)

Metadata stored alongside the snapshot for integrity and management.

## Properties

### compressed

```ts
compressed: boolean;
```

Defined in: [persistence/src/types.ts:63](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L63)

Whether data is compressed.

***

### hash?

```ts
optional hash: string;
```

Defined in: [persistence/src/types.ts:68](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L68)

Optional integrity hash (SHA-256 hex).

***

### savedAt

```ts
savedAt: number;
```

Defined in: [persistence/src/types.ts:48](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L48)

Timestamp when snapshot was saved (ms since epoch).

***

### schemaVersion

```ts
schemaVersion: number;
```

Defined in: [persistence/src/types.ts:53](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L53)

Schema version for migration support.

***

### sizeBytes

```ts
sizeBytes: number;
```

Defined in: [persistence/src/types.ts:58](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L58)

Size of serialized data in bytes (before compression).

***

### ttlMs?

```ts
optional ttlMs: number;
```

Defined in: [persistence/src/types.ts:73](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L73)

Time-to-live in milliseconds. If set, cache expires after savedAt + ttlMs.
