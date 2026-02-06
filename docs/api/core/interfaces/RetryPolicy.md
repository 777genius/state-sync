[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RetryPolicy

# Interface: RetryPolicy

Defined in: [retry.ts:3](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L3)

## Properties

### backoffMultiplier?

```ts
optional backoffMultiplier: number;
```

Defined in: [retry.ts:9](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L9)

Exponential backoff multiplier. Default: 2

***

### initialDelayMs?

```ts
optional initialDelayMs: number;
```

Defined in: [retry.ts:7](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L7)

Initial delay in ms. Default: 500

***

### maxAttempts?

```ts
optional maxAttempts: number;
```

Defined in: [retry.ts:5](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L5)

Max attempts (including the first try). Default: 3

***

### maxDelayMs?

```ts
optional maxDelayMs: number;
```

Defined in: [retry.ts:11](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/core/src/retry.ts#L11)

Max delay in ms. Default: 10000
