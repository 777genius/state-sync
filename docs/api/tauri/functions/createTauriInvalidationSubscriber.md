[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriInvalidationSubscriber

# Function: createTauriInvalidationSubscriber()

```ts
function createTauriInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:42](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/tauri/src/transport.ts#L42)

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
