[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriInvalidationSubscriber

# Function: createTauriInvalidationSubscriber()

```ts
function createTauriInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:42](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/tauri/src/transport.ts#L42)

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
