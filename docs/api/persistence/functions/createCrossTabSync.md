[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createCrossTabSync

# Function: createCrossTabSync()

```ts
function createCrossTabSync<T>(options): CrossTabSync<T>;
```

Defined in: [persistence/src/cross-tab.ts:185](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/cross-tab.ts#L185)

Creates a [CrossTabSync](../interfaces/CrossTabSync.md) manager for real-time state synchronization
between browser tabs.

Uses the BroadcastChannel API to send and receive messages. If
BroadcastChannel is not supported (e.g., in Node.js or restricted iframes),
a no-op implementation is returned silently.

Messages from the current tab are automatically ignored to prevent echo loops.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CrossTabSyncHandlers`](../interfaces/CrossTabSyncHandlers.md)\<`T`\> | Channel configuration and event handler callbacks. |

## Returns

[`CrossTabSync`](../interfaces/CrossTabSync.md)\<`T`\>

A cross-tab sync manager. Call [CrossTabSync.dispose](../interfaces/CrossTabSync.md#dispose) when done.

## Example

```typescript
const crossTab = createCrossTabSync<MyState>({
  channelName: 'state-sync:settings',
  onSnapshot: (snapshot, tabId) => {
    console.log(`Received state from tab ${tabId}`);
    applier.apply(snapshot);
  },
});
```
