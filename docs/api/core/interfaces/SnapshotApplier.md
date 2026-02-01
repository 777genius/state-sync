[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SnapshotApplier

# Interface: SnapshotApplier\<T\>

Defined in: [types.ts:55](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L55)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [types.ts:56](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L56)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`SnapshotEnvelope`](SnapshotEnvelope.md)\<`T`\> |

#### Returns

`void` \| `Promise`\<`void`\>
