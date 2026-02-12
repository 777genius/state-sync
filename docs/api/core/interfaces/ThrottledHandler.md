[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / ThrottledHandler

# Interface: ThrottledHandler

Defined in: [throttle.ts:85](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/throttle.ts#L85)

Handle returned by [createThrottledHandler](../functions/createThrottledHandler.md) that provides controlled
access to a throttled/debounced refresh callback.

Callers use [trigger()](#trigger) to signal that a refresh is
desired. The handler decides when to actually invoke the underlying callback
based on its throttling configuration.

## Methods

### dispose()

```ts
dispose(): void;
```

Defined in: [throttle.ts:102](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/throttle.ts#L102)

Cancel all pending timers and reset internal state.

Must be called when the sync handle is stopped to prevent stale
callbacks from firing after disposal. After calling `dispose()`,
the handler should not be used again.

#### Returns

`void`

***

### hasPending()

```ts
hasPending(): boolean;
```

Defined in: [throttle.ts:110](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/throttle.ts#L110)

Check whether there is a pending refresh scheduled but not yet executed.

#### Returns

`boolean`

`true` if a refresh is queued via debounce or trailing-edge timer,
         `false` otherwise.

***

### trigger()

```ts
trigger(): void;
```

Defined in: [throttle.ts:93](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/throttle.ts#L93)

Signal that a refresh is desired.

The actual refresh callback may be invoked immediately or delayed depending
on the throttling/debounce configuration. Multiple rapid calls to `trigger()`
may result in fewer actual refresh invocations.

#### Returns

`void`
