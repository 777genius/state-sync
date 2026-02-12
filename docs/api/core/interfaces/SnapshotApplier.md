[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotApplier

# Interface: SnapshotApplier\<T\>

Defined in: [types.ts:181](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L181)

Applies a fetched snapshot to local state.

The engine calls [apply](#apply) after successfully
fetching a snapshot that is newer than the current local revision.

## Example

```ts
const applier: SnapshotApplier<UserProfile> = {
  apply({ revision, data }) {
    store.setState({ profile: data });
  },
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [types.ts:191](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L191)

Applies the given snapshot to local state.

May be synchronous or asynchronous. If it returns a promise, the engine
will await it before advancing the local revision.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | [`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\> | The [SnapshotEnvelope](SnapshotEnvelope.md) containing the revision and payload to apply. |

#### Returns

`void` \| `Promise`\<`void`\>

#### Throws

If the local state update fails.
