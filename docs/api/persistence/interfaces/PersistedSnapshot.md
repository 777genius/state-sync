[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshot

# Interface: PersistedSnapshot\<T\>

Defined in: [persistence/src/types.ts:79](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/types.ts#L79)

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

Defined in: [persistence/src/types.ts:81](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/types.ts#L81)

***

### snapshot

```ts
snapshot: SnapshotEnvelope<T>;
```

Defined in: [persistence/src/types.ts:80](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/types.ts#L80)
