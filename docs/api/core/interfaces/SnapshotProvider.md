[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotProvider

# Interface: SnapshotProvider\<T\>

Defined in: [types.ts:51](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/types.ts#L51)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### getSnapshot()

```ts
getSnapshot(): Promise<SnapshotEnvelope<T>>;
```

Defined in: [types.ts:52](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/types.ts#L52)

#### Returns

`Promise`\<[`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\>\>
