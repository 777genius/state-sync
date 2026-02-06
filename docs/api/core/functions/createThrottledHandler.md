[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createThrottledHandler

# Function: createThrottledHandler()

```ts
function createThrottledHandler(onRefresh, options?): ThrottledHandler;
```

Defined in: [throttle.ts:63](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/throttle.ts#L63)

Creates a throttled handler that controls refresh rate.

Behavior:
- No options: passthrough (immediate call)
- debounceMs only: classic debounce
- throttleMs only: classic throttle with leading/trailing edges
- Both: debounce within throttle window

## Parameters

| Parameter | Type |
| ------ | ------ |
| `onRefresh` | () => `void` |
| `options?` | [`InvalidationThrottlingOptions`](../interfaces/InvalidationThrottlingOptions.md) |

## Returns

[`ThrottledHandler`](../interfaces/ThrottledHandler.md)
