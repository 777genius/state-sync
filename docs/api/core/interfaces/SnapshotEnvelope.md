[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotEnvelope

# Interface: SnapshotEnvelope\<T\>

Defined in: [types.ts:94](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L94)

A versioned wrapper around a snapshot payload.

Returned by [SnapshotProvider.getSnapshot](SnapshotProvider.md#getsnapshot) and passed to
[SnapshotApplier.apply](SnapshotApplier.md#apply). The `revision` field lets the engine
determine whether the snapshot is newer than the locally held state.

## Example

```ts
const envelope: SnapshotEnvelope<UserProfile> = {
  revision: '42' as Revision,
  data: { name: 'Alice', email: 'alice@example.com' },
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Properties

### data

```ts
data: T;
```

Defined in: [types.ts:98](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L98)

The application-specific snapshot payload.

***

### revision

```ts
revision: Revision;
```

Defined in: [types.ts:96](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L96)

The revision this snapshot corresponds to.
