[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RevisionSyncHandle

# Interface: RevisionSyncHandle

Defined in: [engine.ts:116](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/engine.ts#L116)

A handle for controlling a running revision-based sync loop.

Returned by [createRevisionSync](../functions/createRevisionSync.md). The sync loop does not start
automatically -- call [start](#start) to begin subscribing and fetching.
Call [stop](#stop) to tear down all subscriptions and timers.

## Example

```ts
const handle = createRevisionSync(options);
await handle.start();

// Later, force a manual refresh:
await handle.refresh();

// Teardown:
handle.stop();
```

## Methods

### getLocalRevision()

```ts
getLocalRevision(): Revision;
```

Defined in: [engine.ts:152](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/engine.ts#L152)

Returns the most recently applied local revision.

Before the first successful snapshot apply, this returns `ZERO_REVISION` (`"0"`).

#### Returns

[`Revision`](../type-aliases/Revision.md)

The current local [Revision](../type-aliases/Revision.md).

***

### refresh()

```ts
refresh(): Promise<void>;
```

Defined in: [engine.ts:144](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/engine.ts#L144)

Manually triggers a snapshot fetch and apply cycle.

Concurrent calls are coalesced: if a refresh is already in flight,
the new request is queued and executed once the current one completes.
If the handle is stopped, this is a no-op.

#### Returns

`Promise`\<`void`\>

#### Throws

If the snapshot fetch or apply fails.

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [engine.ts:127](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/engine.ts#L127)

Starts the sync loop: subscribes to invalidation events and performs
the initial snapshot fetch.

Must be called exactly once. Calling `start()` after `stop()` throws.
Calling `start()` while already started is a no-op.

#### Returns

`Promise`\<`void`\>

#### Throws

If subscription fails or the initial snapshot fetch fails.
        On failure the handle is reset and can be retried by calling `start()` again.

***

### stop()

```ts
stop(): void;
```

Defined in: [engine.ts:134](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/engine.ts#L134)

Stops the sync loop: unsubscribes from invalidation events, cancels
pending throttled/debounced refreshes, and marks the handle as stopped.

Safe to call multiple times; subsequent calls are no-ops.

#### Returns

`void`
