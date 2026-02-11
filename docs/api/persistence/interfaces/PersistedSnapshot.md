[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshot

# Interface: PersistedSnapshot\<T\>

Defined in: [persistence/src/types.ts:79](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L79)

Wrapper that includes metadata with the snapshot.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### metadata

```ts
metadata: PersistedSnapshotMetadata;
```

Defined in: [persistence/src/types.ts:81](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L81)

***

### snapshot

```ts
snapshot: SnapshotEnvelope<T>;
```

Defined in: [persistence/src/types.ts:80](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L80)
