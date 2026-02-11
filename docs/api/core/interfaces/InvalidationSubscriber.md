[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationSubscriber

# Interface: InvalidationSubscriber

Defined in: [types.ts:47](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/core/src/types.ts#L47)

## Methods

### subscribe()

```ts
subscribe(handler): Promise<Unsubscribe>;
```

Defined in: [types.ts:48](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/core/src/types.ts#L48)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`e`) => `void` |

#### Returns

`Promise`\<[`Unsubscribe`](../type-aliases/Unsubscribe.md)\>
