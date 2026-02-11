[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationSubscriber

# Interface: InvalidationSubscriber

Defined in: [types.ts:47](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/core/src/types.ts#L47)

## Methods

### subscribe()

```ts
subscribe(handler): Promise<Unsubscribe>;
```

Defined in: [types.ts:48](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/core/src/types.ts#L48)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`e`) => `void` |

#### Returns

`Promise`\<[`Unsubscribe`](../type-aliases/Unsubscribe.md)\>
