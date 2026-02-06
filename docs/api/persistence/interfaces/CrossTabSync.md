[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabSync

# Interface: CrossTabSync\<T\>

Defined in: [persistence/src/cross-tab.ts:31](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L31)

Cross-tab synchronization manager using BroadcastChannel API.

Enables real-time state synchronization between browser tabs.

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

| Type Parameter |
| ------ |
| `T` |

## Methods

### broadcast()

```ts
broadcast(snapshot): void;
```

Defined in: [persistence/src/cross-tab.ts:35](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L35)

Broadcast a snapshot to other tabs.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`void`

***

### dispose()

```ts
dispose(): void;
```

Defined in: [persistence/src/cross-tab.ts:60](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L60)

Dispose and close the channel.

#### Returns

`void`

***

### getTabId()

```ts
getTabId(): string;
```

Defined in: [persistence/src/cross-tab.ts:55](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L55)

Get this tab's unique ID.

#### Returns

`string`

***

### isSupported()

```ts
isSupported(): boolean;
```

Defined in: [persistence/src/cross-tab.ts:50](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L50)

Check if BroadcastChannel is supported.

#### Returns

`boolean`

***

### notifyClear()

```ts
notifyClear(): void;
```

Defined in: [persistence/src/cross-tab.ts:45](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L45)

Notify other tabs that storage was cleared.

#### Returns

`void`

***

### requestSync()

```ts
requestSync(): void;
```

Defined in: [persistence/src/cross-tab.ts:40](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L40)

Request sync from other tabs (useful on startup).

#### Returns

`void`
