[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotProvider

# Interface: SnapshotProvider\<T\>

Defined in: [types.ts:51](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/types.ts#L51)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### getSnapshot()

```ts
getSnapshot(): Promise<SnapshotEnvelope<T>>;
```

Defined in: [types.ts:52](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/types.ts#L52)

#### Returns

`Promise`\<[`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\>\>
