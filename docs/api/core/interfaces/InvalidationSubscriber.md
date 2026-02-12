[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationSubscriber

# Interface: InvalidationSubscriber

Defined in: [types.ts:125](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L125)

A transport-agnostic contract for subscribing to invalidation events.

Implementations connect to a real-time channel (WebSocket, SSE, polling, etc.)
and forward incoming [InvalidationEvent](InvalidationEvent.md)s to the provided handler.

## Example

```ts
const subscriber: InvalidationSubscriber = {
  async subscribe(handler) {
    const ws = new WebSocket('wss://example.com/sync');
    ws.onmessage = (msg) => handler(JSON.parse(msg.data));
    return () => ws.close();
  },
};
```

## Methods

### subscribe()

```ts
subscribe(handler): Promise<Unsubscribe>;
```

Defined in: [types.ts:132](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L132)

Registers a handler that will be called for each incoming invalidation event.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handler` | (`e`) => `void` | Callback invoked with each [InvalidationEvent](InvalidationEvent.md). |

#### Returns

`Promise`\<[`Unsubscribe`](../type-aliases/Unsubscribe.md)\>

A promise that resolves to an [Unsubscribe](../type-aliases/Unsubscribe.md) teardown function.
