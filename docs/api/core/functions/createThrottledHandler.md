[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / createThrottledHandler

# Function: createThrottledHandler()

```ts
function createThrottledHandler(onRefresh, options?): ThrottledHandler;
```

Defined in: [throttle.ts:142](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/throttle.ts#L142)

Creates a [ThrottledHandler](../interfaces/ThrottledHandler.md) that controls the rate of refresh calls.

The handler adapts its behavior based on the provided options:
- **No options (or all zero):** Passthrough — `trigger()` calls `onRefresh` immediately.
- **`debounceMs` only:** Classic debounce — waits for a quiet period before calling `onRefresh`.
- **`throttleMs` only:** Classic throttle with configurable leading/trailing edges.
- **Both `debounceMs` and `throttleMs`:** Debounce is applied first, then the result is throttled.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onRefresh` | () => `void` | The callback to invoke when a refresh should occur. This is the actual refresh function that fetches a new snapshot. |
| `options?` | [`InvalidationThrottlingOptions`](../interfaces/InvalidationThrottlingOptions.md) | Optional throttling/debounce configuration. When omitted or empty, the handler acts as a passthrough. |

## Returns

[`ThrottledHandler`](../interfaces/ThrottledHandler.md)

A [ThrottledHandler](../interfaces/ThrottledHandler.md) that wraps `onRefresh` with the configured rate limiting.

## Example

```ts
import { createThrottledHandler } from '@statesync/core';

const handler = createThrottledHandler(
  () => console.log('refresh!'),
  { debounceMs: 200, throttleMs: 1000 },
);

handler.trigger(); // May fire immediately or be delayed
handler.hasPending(); // true if a delayed refresh is scheduled
handler.dispose(); // Cleanup when done
```
