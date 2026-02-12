[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Unsubscribe

# Type Alias: Unsubscribe()

```ts
type Unsubscribe = () => void;
```

Defined in: [types.ts:106](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L106)

A teardown function that removes a previously registered subscription.

Calling it more than once is safe and has no additional effect.

## Returns

`void`
