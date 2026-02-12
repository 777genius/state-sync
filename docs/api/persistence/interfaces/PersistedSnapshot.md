[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshot

# Interface: PersistedSnapshot\<T\>

Defined in: [persistence/src/types.ts:140](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L140)

A persisted snapshot bundled with its associated metadata.

This is the unit of storage for backends that support metadata
([StorageBackendWithMetadata](StorageBackendWithMetadata.md)). It pairs the actual state envelope
with bookkeeping information (timestamps, schema version, compression flag, etc.).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Properties

### metadata

```ts
metadata: PersistedSnapshotMetadata;
```

Defined in: [persistence/src/types.ts:145](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L145)

Metadata describing when and how the snapshot was persisted.

***

### snapshot

```ts
snapshot: SnapshotEnvelope<T>;
```

Defined in: [persistence/src/types.ts:142](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L142)

The snapshot envelope containing the revision and state data.
