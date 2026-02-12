[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / InvalidationEvent

# Interface: InvalidationEvent

Defined in: [types.ts:60](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L60)

An event signaling that the authoritative state for a given topic has changed.

The engine uses this to decide whether a new snapshot should be fetched.
Transport layers (WebSocket, SSE, polling, etc.) produce these events and
deliver them via an [InvalidationSubscriber](InvalidationSubscriber.md).

## Example

```ts
const event: InvalidationEvent = {
  topic: 'user-profile',
  revision: '42' as Revision,
  sourceId: 'server-1',
  timestampMs: Date.now(),
};
```

## Properties

### revision

```ts
revision: Revision;
```

Defined in: [types.ts:64](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L64)

The revision that the server has moved to. Must be a canonical decimal u64 string.

***

### sourceId?

```ts
optional sourceId: string;
```

Defined in: [types.ts:69](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L69)

Optional identifier of the source that produced this event.
Useful for deduplication or debugging in multi-source setups.

***

### timestampMs?

```ts
optional timestampMs: number;
```

Defined in: [types.ts:74](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L74)

Optional timestamp (milliseconds since epoch) of when the event was produced.
The engine does not use this for ordering; it is informational only.

***

### topic

```ts
topic: string;
```

Defined in: [types.ts:62](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L62)

The topic this invalidation belongs to.
