[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronBroadcasterOptions

# Interface: ElectronBroadcasterOptions

Defined in: [main.ts:27](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L27)

Configuration options for [createElectronBroadcaster](../functions/createElectronBroadcaster.md).

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: [main.ts:45](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L45)

Override the default IPC channel name for invalidation events.

Defaults to `statesync:<topic>:invalidated` (produced by [invalidationChannel](../functions/invalidationChannel.md)).

***

### getTargets()

```ts
getTargets: () => ElectronWebContentsLike[];
```

Defined in: [main.ts:39](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L39)

Returns the list of `webContents` targets to broadcast invalidation events to.

Called on every [ElectronBroadcasterHandle.invalidate](ElectronBroadcasterHandle.md#invalidate) invocation.
The returned array is defensively copied (`.slice()`) before iteration,
so it is safe to return a live mutable reference (e.g. from a `Set` or window manager).

#### Returns

[`ElectronWebContentsLike`](ElectronWebContentsLike.md)[]

An array of [ElectronWebContentsLike](ElectronWebContentsLike.md) instances.

***

### topic

```ts
topic: string;
```

Defined in: [main.ts:29](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L29)

The sync topic identifier (e.g. `"user-profile"`).
