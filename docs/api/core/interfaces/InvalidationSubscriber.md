[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationSubscriber

# Interface: InvalidationSubscriber

Defined in: [types.ts:47](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L47)

## Methods

### subscribe()

```ts
subscribe(handler): Promise<Unsubscribe>;
```

Defined in: [types.ts:48](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L48)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`e`) => `void` |

#### Returns

`Promise`\<[`Unsubscribe`](../type-aliases/Unsubscribe.md)\>
