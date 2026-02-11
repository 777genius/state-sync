[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotApplier

# Interface: SnapshotApplier\<T\>

Defined in: [types.ts:55](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/core/src/types.ts#L55)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [types.ts:56](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/core/src/types.ts#L56)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\> |

#### Returns

`void` \| `Promise`\<`void`\>
