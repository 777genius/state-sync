[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshotMetadata

# Interface: PersistedSnapshotMetadata

Defined in: [persistence/src/types.ts:82](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L82)

Metadata stored alongside a persisted snapshot for integrity checking,
expiration management, and schema migration.

This metadata is written to storage by backends that implement
[StorageBackendWithMetadata](StorageBackendWithMetadata.md) and is used during load to decide
whether the snapshot is still valid.

## Properties

### compressed

```ts
compressed: boolean;
```

Defined in: [persistence/src/types.ts:111](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L111)

Whether the snapshot data was compressed before storage.

When `true`, the data must be decompressed using the same
[CompressionAdapter](CompressionAdapter.md) that was used during save.

***

### hash?

```ts
optional hash: string;
```

Defined in: [persistence/src/types.ts:119](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L119)

Optional integrity hash of the serialized (and possibly compressed) data.

Computed using a non-cryptographic hash function. Verified during load
when the `verifyHash` option is enabled in [LoadOptions](LoadOptions.md).

***

### savedAt

```ts
savedAt: number;
```

Defined in: [persistence/src/types.ts:88](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L88)

Timestamp when the snapshot was saved, in milliseconds since the Unix epoch.

Used together with [ttlMs](#ttlms) to determine cache expiration.

***

### schemaVersion

```ts
schemaVersion: number;
```

Defined in: [persistence/src/types.ts:96](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L96)

Schema version number at the time the snapshot was saved.

Compared against the current version during load to determine whether
data migration is needed. Versions are sequential positive integers.

***

### sizeBytes

```ts
sizeBytes: number;
```

Defined in: [persistence/src/types.ts:103](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L103)

Size of the serialized JSON data in bytes, measured **before** compression.

Useful for observability and storage quota estimation.

***

### ttlMs?

```ts
optional ttlMs: number;
```

Defined in: [persistence/src/types.ts:128](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L128)

Time-to-live in milliseconds. When set, the cached snapshot is considered
expired if `Date.now() - savedAt > ttlMs`.

Expired snapshots are discarded during load unless `ignoreTTL` is set
in [LoadOptions](LoadOptions.md).
