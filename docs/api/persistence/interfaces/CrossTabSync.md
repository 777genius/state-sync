[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSync

# Interface: CrossTabSync\<T\>

Defined in: [persistence/src/cross-tab.ts:60](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L60)

Cross-tab synchronization manager using the BroadcastChannel API.

Enables real-time state synchronization between browser tabs sharing the
same origin and channel name. Messages from the current tab are automatically
filtered out. In environments where BroadcastChannel is unavailable, all
methods become no-ops.

Created via [createCrossTabSync](../functions/createCrossTabSync.md).

## Example

```typescript
const crossTab = createCrossTabSync<AppState>({
  channelName: 'my-app-state',
  onSnapshot: (snapshot) => applier.apply(snapshot),
});

// Broadcast to other tabs after save
crossTab.broadcast(snapshot);

// Cleanup
crossTab.dispose();
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Methods

### broadcast()

```ts
broadcast(snapshot): void;
```

Defined in: [persistence/src/cross-tab.ts:69](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L69)

Broadcast a snapshot to all other tabs listening on the same channel.

No-op if the instance is disposed, the channel is closed, or
[CrossTabSyncOptions.broadcastSaves](CrossTabSyncHandlers.md#broadcastsaves) is `false`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot envelope to broadcast. |

#### Returns

`void`

***

### dispose()

```ts
dispose(): void;
```

Defined in: [persistence/src/cross-tab.ts:105](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L105)

Close the BroadcastChannel and release all resources.

After disposal, all methods become no-ops. Safe to call multiple times.

#### Returns

`void`

***

### getTabId()

```ts
getTabId(): string;
```

Defined in: [persistence/src/cross-tab.ts:98](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L98)

Get the unique identifier assigned to this tab.

The ID is generated at construction time and is used to filter out
messages originating from this tab.

#### Returns

`string`

A string identifier unique to this tab instance.

***

### isSupported()

```ts
isSupported(): boolean;
```

Defined in: [persistence/src/cross-tab.ts:88](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L88)

Check whether the BroadcastChannel API is available and the channel
was successfully created.

#### Returns

`boolean`

`true` if cross-tab communication is functional.

***

### notifyClear()

```ts
notifyClear(): void;
```

Defined in: [persistence/src/cross-tab.ts:80](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L80)

Notify other tabs that this tab has cleared its persisted storage.

#### Returns

`void`

***

### requestSync()

```ts
requestSync(): void;
```

Defined in: [persistence/src/cross-tab.ts:75](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L75)

Send a sync request to other tabs, asking them to broadcast their
latest state. Useful during tab startup to hydrate from a peer.

#### Returns

`void`
