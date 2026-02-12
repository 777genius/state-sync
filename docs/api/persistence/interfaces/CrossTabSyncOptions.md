[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSyncOptions

# Interface: CrossTabSyncOptions

Defined in: [persistence/src/types.ts:726](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L726)

Options for cross-tab state synchronization via the BroadcastChannel API.

Controls the channel name and whether this tab sends and/or receives updates.

## Extended by

- [`CrossTabSyncHandlers`](CrossTabSyncHandlers.md)

## Properties

### broadcastSaves?

```ts
optional broadcastSaves: boolean;
```

Defined in: [persistence/src/types.ts:747](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L747)

Whether this tab should broadcast its saves to other tabs.

#### Default Value

`true`

***

### channelName

```ts
channelName: string;
```

Defined in: [persistence/src/types.ts:733](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L733)

The name of the BroadcastChannel used for inter-tab communication.

All tabs that should synchronize state must use the same channel name.
Convention: `'state-sync:<topic>'`.

***

### receiveUpdates?

```ts
optional receiveUpdates: boolean;
```

Defined in: [persistence/src/types.ts:740](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L740)

Whether this tab should apply snapshots received from other tabs.

#### Default Value

`true`
