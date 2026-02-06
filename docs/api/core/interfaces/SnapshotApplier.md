[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotApplier

# Interface: SnapshotApplier\<T\>

Defined in: [types.ts:55](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/types.ts#L55)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [types.ts:56](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/types.ts#L56)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\> |

#### Returns

`void` \| `Promise`\<`void`\>
