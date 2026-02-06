[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RetryReportingOptions

# Interface: RetryReportingOptions

Defined in: [retry.ts:66](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/retry.ts#L66)

## Properties

### logger?

```ts
optional logger: Logger;
```

Defined in: [retry.ts:69](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/retry.ts#L69)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [retry.ts:75](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/retry.ts#L75)

Optional error hook. This reports retry attempts with:
- phase = 'getSnapshot'
- willRetry = true

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`SyncErrorContext`](SyncErrorContext.md) |

#### Returns

`void`

***

### policy?

```ts
optional policy: RetryPolicy;
```

Defined in: [retry.ts:68](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/retry.ts#L68)

***

### topic

```ts
topic: string;
```

Defined in: [retry.ts:67](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/retry.ts#L67)
