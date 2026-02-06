[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSyncOptions

# Interface: CrossTabSyncOptions

Defined in: [persistence/src/types.ts:410](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L410)

Options for cross-tab synchronization.

## Extended by

- [`CrossTabSyncHandlers`](CrossTabSyncHandlers.md)

## Properties

### broadcastSaves?

```ts
optional broadcastSaves: boolean;
```

Defined in: [persistence/src/types.ts:426](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L426)

If true, broadcast saves to other tabs.
Default: true

***

### channelName

```ts
channelName: string;
```

Defined in: [persistence/src/types.ts:414](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L414)

Channel name for BroadcastChannel.

***

### receiveUpdates?

```ts
optional receiveUpdates: boolean;
```

Defined in: [persistence/src/types.ts:420](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L420)

If true, apply updates from other tabs.
Default: true
