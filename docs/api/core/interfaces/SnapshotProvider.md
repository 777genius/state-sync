[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotProvider

# Interface: SnapshotProvider\<T\>

Defined in: [types.ts:153](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L153)

Fetches the latest authoritative snapshot for a given topic.

The engine calls [getSnapshot](#getsnapshot) whenever
a refresh is needed (after an invalidation or on initial start).

## Example

```ts
const provider: SnapshotProvider<UserProfile> = {
  async getSnapshot() {
    const res = await fetch('/api/user-profile/snapshot');
    return res.json(); // { revision, data }
  },
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Methods

### getSnapshot()

```ts
getSnapshot(): Promise<SnapshotEnvelope<T>>;
```

Defined in: [types.ts:161](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L161)

Retrieves the most recent snapshot from the authoritative source.

#### Returns

`Promise`\<[`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\>\>

A promise resolving to a [SnapshotEnvelope](SnapshotEnvelope.md) containing the
         revision and the snapshot payload.

#### Throws

If the underlying fetch or data retrieval fails.
