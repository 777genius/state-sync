[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RetryPolicy

# Interface: RetryPolicy

Defined in: [retry.ts:30](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L30)

Configuration for retry behavior with exponential backoff.

All fields are optional and fall back to sensible defaults when omitted.
The delay between retries grows exponentially: `initialDelayMs * backoffMultiplier ^ attempt`,
capped at `maxDelayMs`.

## Example

```ts
const policy: RetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  backoffMultiplier: 1.5,
  maxDelayMs: 30_000,
};
```

## Properties

### backoffMultiplier?

```ts
optional backoffMultiplier: number;
```

Defined in: [retry.ts:57](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L57)

Multiplier applied to the delay for each successive retry attempt.

The delay for attempt N is: `initialDelayMs * backoffMultiplier ^ N`.
Set to `1` for fixed-interval retries (no exponential growth).

#### Default Value

`2`

***

### initialDelayMs?

```ts
optional initialDelayMs: number;
```

Defined in: [retry.ts:47](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L47)

Delay in milliseconds before the first retry attempt.

Subsequent retries are scaled by [backoffMultiplier](#backoffmultiplier).

#### Default Value

`500`

***

### maxAttempts?

```ts
optional maxAttempts: number;
```

Defined in: [retry.ts:38](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L38)

Maximum number of attempts including the initial try.

For example, `maxAttempts: 3` means 1 initial try + 2 retries.

#### Default Value

`3`

***

### maxDelayMs?

```ts
optional maxDelayMs: number;
```

Defined in: [retry.ts:66](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/retry.ts#L66)

Upper bound for the computed delay in milliseconds.

Prevents the exponential backoff from growing unboundedly.

#### Default Value

`10_000`
