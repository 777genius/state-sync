[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotProvider

# Interface: SnapshotProvider\<T\>

Defined in: [types.ts:51](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L51)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### getSnapshot()

```ts
getSnapshot(): Promise<SnapshotEnvelope<T>>;
```

Defined in: [types.ts:52](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L52)

#### Returns

`Promise`\<[`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\>\>
