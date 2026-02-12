[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSyncHandlers

# Interface: CrossTabSyncHandlers\<T\>

Defined in: [persistence/src/cross-tab.ts:116](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L116)

Configuration and event handlers for [createCrossTabSync](../functions/createCrossTabSync.md).

Extends [CrossTabSyncOptions](CrossTabSyncOptions.md) with callback handlers for each
type of cross-tab message.

## Extends

- [`CrossTabSyncOptions`](CrossTabSyncOptions.md)

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Properties

### broadcastSaves?

```ts
optional broadcastSaves: boolean;
```

Defined in: [persistence/src/types.ts:747](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L747)

Whether this tab should broadcast its saves to other tabs.

#### Default Value

`true`

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`broadcastSaves`](CrossTabSyncOptions.md#broadcastsaves)

***

### channelName

```ts
channelName: string;
```

Defined in: [persistence/src/types.ts:733](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L733)

The name of the BroadcastChannel used for inter-tab communication.

All tabs that should synchronize state must use the same channel name.
Convention: `'state-sync:<topic>'`.

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`channelName`](CrossTabSyncOptions.md#channelname)

***

### onClear()?

```ts
optional onClear: (fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:138](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L138)

Called when another tab notifies that it has cleared its storage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fromTabId` | `string` | The unique identifier of the tab that cleared storage. |

#### Returns

`void`

***

### onSnapshot()?

```ts
optional onSnapshot: (snapshot, fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:123](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L123)

Called when a snapshot is received from another tab.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot envelope broadcast by the other tab. |
| `fromTabId` | `string` | The unique identifier of the sending tab. |

#### Returns

`void`

***

### onSyncRequest()?

```ts
optional onSyncRequest: (fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:131](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L131)

Called when another tab sends a sync request, asking this tab to
broadcast its latest state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fromTabId` | `string` | The unique identifier of the requesting tab. |

#### Returns

`void`

***

### receiveUpdates?

```ts
optional receiveUpdates: boolean;
```

Defined in: [persistence/src/types.ts:740](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L740)

Whether this tab should apply snapshots received from other tabs.

#### Default Value

`true`

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`receiveUpdates`](CrossTabSyncOptions.md#receiveupdates)
