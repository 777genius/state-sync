[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / ThrottledHandler

# Interface: ThrottledHandler

Defined in: [throttle.ts:35](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/throttle.ts#L35)

## Methods

### dispose()

```ts
dispose(): void;
```

Defined in: [throttle.ts:46](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/throttle.ts#L46)

Cleanup all pending timers and reset state.
Should be called when the sync handle is stopped.

#### Returns

`void`

***

### hasPending()

```ts
hasPending(): boolean;
```

Defined in: [throttle.ts:51](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/throttle.ts#L51)

Returns true if there's a pending refresh scheduled.

#### Returns

`boolean`

***

### trigger()

```ts
trigger(): void;
```

Defined in: [throttle.ts:40](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/throttle.ts#L40)

Trigger a refresh. The actual refresh call may be delayed
based on the throttling configuration.

#### Returns

`void`
