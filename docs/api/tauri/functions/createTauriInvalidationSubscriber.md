[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriInvalidationSubscriber

# Function: createTauriInvalidationSubscriber()

```ts
function createTauriInvalidationSubscriber(options): InvalidationSubscriber;
```

Defined in: [transport.ts:128](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/transport.ts#L128)

Creates an InvalidationSubscriber backed by Tauri's event system.

The returned subscriber listens for events on the specified channel and
forwards each payload to the core engine as an InvalidationEvent.
No validation or transformation is performed here; the core engine validates
`topic` and `revision` at runtime.

**Rust backend requirement:** The backend must emit events whose JSON payload
has at least `{ topic: string, revision: string }`. Additional fields
(`sourceId`, `timestampMs`) are optional but recommended.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`TauriInvalidationSubscriberOptions`](../interfaces/TauriInvalidationSubscriberOptions.md) | Configuration specifying the `listen` function and event name. |

## Returns

`InvalidationSubscriber`

An InvalidationSubscriber that can be passed to `createRevisionSync`.

## Example

```typescript
import { listen } from '@tauri-apps/api/event';

const subscriber = createTauriInvalidationSubscriber({
  listen,
  eventName: 'state-sync:invalidation',
});

// Use with the core engine:
const sync = createRevisionSync({
  topic: 'my-topic',
  subscriber,
  provider,
  applier,
});
```
