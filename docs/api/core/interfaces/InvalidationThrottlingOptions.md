[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationThrottlingOptions

# Interface: InvalidationThrottlingOptions

Defined in: [throttle.ts:37](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L37)

Configuration options for controlling invalidation-driven refresh rate.

Supports three modes of operation:
- **Debounce only** (`debounceMs`): Waits for a quiet period before refreshing.
- **Throttle only** (`throttleMs`): Limits refresh to at most once per interval.
- **Combined** (both set): Debounce is applied first, then throttle limits the output rate.

When neither option is set, refresh calls are passed through immediately.

## Example

```ts
// Debounce: wait 200ms of silence before refreshing
const opts: InvalidationThrottlingOptions = { debounceMs: 200 };

// Throttle: at most 1 refresh per second
const opts: InvalidationThrottlingOptions = { throttleMs: 1000 };

// Combined: debounce 100ms, then throttle to 1/sec
const opts: InvalidationThrottlingOptions = {
  debounceMs: 100,
  throttleMs: 1000,
};
```

## Properties

### debounceMs?

```ts
optional debounceMs: number;
```

Defined in: [throttle.ts:45](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L45)

Debounce delay in milliseconds.

Waits until this many milliseconds of "silence" (no new triggers) before
firing a refresh. If both `debounceMs` and `throttleMs` are set, debounce
is applied first within the throttle window.

***

### leading?

```ts
optional leading: boolean;
```

Defined in: [throttle.ts:63](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L63)

Whether to fire immediately on the leading edge of the throttle window.

When `true`, the first trigger in a new throttle window fires immediately.
Only applies when `throttleMs` is set.

#### Default Value

`true`

***

### throttleMs?

```ts
optional throttleMs: number;
```

Defined in: [throttle.ts:53](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L53)

Throttle interval in milliseconds.

Ensures at most one refresh per this many milliseconds. Controls the
maximum rate of refresh calls regardless of how many triggers arrive.

***

### trailing?

```ts
optional trailing: boolean;
```

Defined in: [throttle.ts:74](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L74)

Whether to fire on the trailing edge after the throttle window ends.

When `true`, a final refresh is scheduled after the quiet period if any
triggers arrived during the throttle window. Only applies when `throttleMs`
is set.

#### Default Value

`true`
