[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSyncHandlers

# Interface: CrossTabSyncHandlers\<T\>

Defined in: [persistence/src/cross-tab.ts:66](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L66)

Options for creating cross-tab sync.

## Extends

- [`CrossTabSyncOptions`](CrossTabSyncOptions.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### broadcastSaves?

```ts
optional broadcastSaves: boolean;
```

Defined in: [persistence/src/types.ts:426](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L426)

If true, broadcast saves to other tabs.
Default: true

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`broadcastSaves`](CrossTabSyncOptions.md#broadcastsaves)

***

### channelName

```ts
channelName: string;
```

Defined in: [persistence/src/types.ts:414](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L414)

Channel name for BroadcastChannel.

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`channelName`](CrossTabSyncOptions.md#channelname)

***

### onClear()?

```ts
optional onClear: (fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:80](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L80)

Called when another tab clears storage.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fromTabId` | `string` |

#### Returns

`void`

***

### onSnapshot()?

```ts
optional onSnapshot: (snapshot, fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:70](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L70)

Called when a snapshot is received from another tab.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |
| `fromTabId` | `string` |

#### Returns

`void`

***

### onSyncRequest()?

```ts
optional onSyncRequest: (fromTabId) => void;
```

Defined in: [persistence/src/cross-tab.ts:75](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L75)

Called when another tab requests sync.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fromTabId` | `string` |

#### Returns

`void`

***

### receiveUpdates?

```ts
optional receiveUpdates: boolean;
```

Defined in: [persistence/src/types.ts:420](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L420)

If true, apply updates from other tabs.
Default: true

#### Inherited from

[`CrossTabSyncOptions`](CrossTabSyncOptions.md).[`receiveUpdates`](CrossTabSyncOptions.md#receiveupdates)
