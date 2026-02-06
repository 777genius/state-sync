[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationThrottlingOptions

# Interface: InvalidationThrottlingOptions

Defined in: throttle.ts:8

Invalidation throttling utilities for state-sync.

Provides debounce and throttle mechanisms to control the rate of
refresh calls triggered by rapid invalidation events.

## Properties

### debounceMs?

```ts
optional debounceMs: number;
```

Defined in: throttle.ts:14

Debounce delay in milliseconds.
Waits until N ms of "silence" before triggering refresh.
If both debounceMs and throttleMs are set, debounce is applied first.

***

### leading?

```ts
optional leading: boolean;
```

Defined in: throttle.ts:26

Fire immediately on the first event (default: true).
Only applies when throttleMs is set.

***

### throttleMs?

```ts
optional throttleMs: number;
```

Defined in: throttle.ts:20

Throttle interval in milliseconds.
Ensures at most 1 refresh per N ms.

***

### trailing?

```ts
optional trailing: boolean;
```

Defined in: throttle.ts:32

Fire after the quiet period ends (default: true).
Only applies when throttleMs is set.
