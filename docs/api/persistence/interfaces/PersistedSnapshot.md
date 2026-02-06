[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistedSnapshot

# Interface: PersistedSnapshot\<T\>

Defined in: [persistence/src/types.ts:79](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L79)

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

Defined in: [persistence/src/types.ts:81](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L81)

***

### snapshot

```ts
snapshot: SnapshotEnvelope<T>;
```

Defined in: [persistence/src/types.ts:80](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L80)
