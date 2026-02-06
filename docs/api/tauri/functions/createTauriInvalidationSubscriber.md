[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriInvalidationSubscriber

# Function: createTauriInvalidationSubscriber()

```ts
function createTauriInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:42](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/tauri/src/transport.ts#L42)

Creates an InvalidationSubscriber using Tauri's event system.

IMPORTANT:
- The engine validates `topic` and `revision` at runtime.
- This transport is intentionally thin: it just forwards payloads.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TauriInvalidationSubscriberOptions`](../interfaces/TauriInvalidationSubscriberOptions.md) |

## Returns

`InvalidationSubscriber`
