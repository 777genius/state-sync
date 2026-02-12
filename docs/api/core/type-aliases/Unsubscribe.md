[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Unsubscribe

# Type Alias: Unsubscribe()

```ts
type Unsubscribe = () => void;
```

Defined in: [types.ts:106](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L106)

A teardown function that removes a previously registered subscription.

Calling it more than once is safe and has no additional effect.

## Returns

`void`
